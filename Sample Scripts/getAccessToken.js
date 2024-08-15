/*
 * Requires following ESVs
 *
 * 1. esv.tenant.env.fqdn - for example: openam-mycompany-mytenant-usw1.id.forgerock.io
 * 2. esv.service.account.id - for example: 94ab7670-xxxx-xxxx-xxxx-xxxxxxxxxxxxx
 * 3. esv.service.account.privatekey - for example:
 *     {
 *       d: "RhpIZ32rNfkoVkQh3pt1me...rDkFL9nBWDOZvXQ2LsFEBc",
 *       dp: "RfrvtBH_NmzxS......IpJ1vYZS_J0cw",
 *       dq: "OVO8_yXFRHT...2VREB2b8f8xvIhv5jrQWQ",
 *       e: "AQAB",
 *       kty: "RSA",
 *       n: "5LoH3Fc8IdRg1...K4eUvMEJsjVvfRgzpWCDM0",
 *       p: "_wjzIYyYcQiNOZdV1Cp7...kjDw",
 *       q: "5ZeYq0C......6WOaiYw",
 *       qi: "Z9ECeon...q56tpl2Mu65yqlw",
 *     }
 */

var nodeConfig = {
  nodeName: "GetAccessTokenDemo",
  tenantFqdnEsv: "esv.tenant.env.fqdn",
  accountIdEsv: "esv.service.account.id",
  privateKeyEsv: "esv.service.account.privatekey",
  accessTokenStateField: "idmAccessToken",
  maxAttempts: 3,
  scope: "fr:idm:*",
  serviceAccountClientId: "service-account",
  jwtValiditySeconds: 10,
};

var nodeLogger = {
  debug: function (message) {
    logger.message("***" + nodeConfig.nodeName + " " + message);
  },
  warning: function (message) {
    logger.warning("***" + nodeConfig.nodeName + " " + message);
  },
  error: function (message) {
    logger.error("***" + nodeConfig.nodeName + " " + message);
  },
};

var nodeOutcomes = {
  SUCCESS: "success",
  ERROR: "error",
};

var javaImports = JavaImporter(
  org.forgerock.openam.auth.node.api.Action,
  org.forgerock.json.jose.builders.JwtBuilderFactory,
  org.forgerock.json.jose.jwt.JwtClaimsSet,
  org.forgerock.json.jose.jws.JwsAlgorithm,
  org.forgerock.json.jose.jws.SignedJwt,
  org.forgerock.json.jose.jws.handlers.SecretRSASigningHandler,
  org.forgerock.json.jose.jwk.RsaJWK,
  javax.crypto.spec.SecretKeySpec,
  org.forgerock.secrets.SecretBuilder,
  org.forgerock.secrets.keys.SigningKey,
  java.time.temporal.ChronoUnit,
  java.time.Clock,
  java.util.UUID
);

function getKeyFromJwk(issuer, jwk) {
  var privateKey = javaImports.RsaJWK.parse(jwk).toRSAPrivateKey();

  var secretBuilder = new javaImports.SecretBuilder();

  secretBuilder
    .secretKey(privateKey)
    .stableId(issuer)
    .expiresIn(
      5,
      javaImports.ChronoUnit.MINUTES,
      javaImports.Clock.systemUTC()
    );
  return new javaImports.SigningKey(secretBuilder);
}

function getAssertionJwt(accountId, privateKey, audience, validity) {
  var signingHandler = new javaImports.SecretRSASigningHandler(
    getKeyFromJwk(accountId, privateKey)
  );

  var iat = new Date().getTime();
  var exp = new Date(iat + validity * 1000);

  var jwtClaims = new javaImports.JwtClaimsSet();

  jwtClaims.setIssuer(accountId);
  jwtClaims.setSubject(accountId);
  jwtClaims.addAudience(audience);
  jwtClaims.setExpirationTime(exp);
  jwtClaims.setJwtId(javaImports.UUID.randomUUID());

  var jwt = new javaImports.JwtBuilderFactory()
    .jws(signingHandler)
    .headers()
    .alg(javaImports.JwsAlgorithm.RS256)
    .done()
    .claims(jwtClaims)
    .build();

  return jwt;
}

function getAccessToken(accountId, privateKey, tenantFqdn, maxAttempts) {
  var response = null;
  var accessToken = null;
  var tokenEndpoint = "https://"
    .concat(tenantFqdn)
    .concat("/am/oauth2/access_token");

  nodeLogger.debug("Getting Access Token from endpoint " + tokenEndpoint);

  var assertionJwt = getAssertionJwt(
    accountId,
    privateKey,
    tokenEndpoint,
    nodeConfig.jwtValiditySeconds
  );

  if (!assertionJwt) {
    nodeLogger.error("Error getting assertion JWT");
    return null;
  }

  nodeLogger.debug("Got assertion JWT " + assertionJwt);

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    nodeLogger.debug("Attempt " + (attempt + 1) + " of " + maxAttempts);
    try {
      var request = new org.forgerock.http.protocol.Request();
      request.setUri(tokenEndpoint);
      request.setMethod("POST");
      request
        .getHeaders()
        .add("Content-Type", "application/x-www-form-urlencoded");

      var params = "grant_type="
        .concat(
          encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")
        )
        .concat("&client_id=")
        .concat(encodeURIComponent(nodeConfig.serviceAccountClientId))
        .concat("&assertion=")
        .concat(encodeURIComponent(assertionJwt))
        .concat("&scope=")
        .concat(encodeURIComponent(nodeConfig.scope));

      request.setEntity(params);
      response = httpClient.send(request).get();
      if (response) {
        break;
      }
    } catch (e) {
      nodeLogger.error(
        "Failure calling access token endpoint: " +
          tokenEndpoint +
          " exception:" +
          e
      );
    }
  }

  if (!response) {
    nodeLogger.error("Bad response");
    return null;
  }

  if (response.getStatus().getCode() !== 200) {
    nodeLogger.error(
      "Unable to acquire Access Token. HTTP Result: " + response.getStatus()
    );
    return null;
  }

  try {
    var responseJson = response.getEntity().getString();
    nodeLogger.debug("Response content " + responseJson);
    var oauth2response = JSON.parse(responseJson);
    accessToken = oauth2response.access_token;
    nodeLogger.debug("Access Token acquired: " + accessToken);
    return accessToken;
  } catch (e) {
    nodeLogger.error("Error getting access token from response: " + e);
  }

  return null;
}

(function () {
  try {
    nodeLogger.debug("Node starting");

    var accessToken = nodeState.get(nodeConfig.accessTokenStateField);

    if (accessToken) {
      nodeLogger.debug("Access token already present: continuing");
      action = javaImports.Action.goTo(nodeOutcomes.SUCCESS).build();
      return;
    }

    var tenantFqdn = systemEnv.getProperty(nodeConfig.tenantFqdnEsv);
    if (!tenantFqdn) {
      nodeLogger.error("Couldn't get FQDN from esv " + config.tenantFqdnEsv);
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    var accountId = systemEnv.getProperty(nodeConfig.accountIdEsv);
    if (!accountId) {
      nodeLogger.error(
        "Couldn't get service account id from esv " + nodeConfig.accountIdEsv
      );
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    var privateKey = systemEnv.getProperty(nodeConfig.privateKeyEsv);
    if (!privateKey) {
      nodeLogger.error(
        "Couldn't get private key from esv " + nodeConfig.privateKey
      );
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    accessToken = getAccessToken(
      accountId,
      privateKey,
      tenantFqdn,
      nodeConfig.maxAttempts
    );

    if (!accessToken) {
      nodeLogger.error("Failed to get access token");
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    nodeLogger.debug("Success - adding token to transient state");
    nodeState.putTransient(nodeConfig.accessTokenStateField, accessToken);
    action = javaImports.Action.goTo(nodeOutcomes.SUCCESS).build();
  } catch (e) {
    nodeLogger.error("Exception encountered " + e);
    action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
    return;
  }
})();
