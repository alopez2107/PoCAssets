(function () {
    var sapiGFQDN = request.additionalParameters.sapiGFQDN;
    if (request.method === 'create') {
        logger.error("ALEXLOG: Custom Endpoint Content object is {}", JSON.stringify(request.content))
        var tlsCert = request.content.tlsCert;
        var tlsPrivateKey = request.content.tlsPrivateKey;
        var tppJwks = request.content.jwks;
        var orgId = request.content.orgId;
        var orgName = request.content.orgName;
        var softwareDescription = request.content.softwareDescription;

        var uuid = require('uuid');
        var software_id = uuid.v4();
        var tppRedirectUris = [request.content.redirectUri];

        var ssaContent = {
            software_id: software_id,
            software_client_name: softwareDescription,
            software_client_id: software_id,
            software_tos_uri: "https://github.com/SecureApiGateway",
            software_client_description: softwareDescription,
            software_redirect_uris: tppRedirectUris,
            software_policy_uri: "https://github.com/SecureApiGateway",
            software_logo_uri: "https://avatars.githubusercontent.com/u/74596995?s=96&v=4",
            software_roles: [
                "DATA",
                "AISP",
                "CBPII",
                "PISP"],
            software_jwks: tppJwks
        };

        var ssaJWT = null;

        const https = require('https');

        var ssaOptions = {
            hostname: sapiGFQDN, // SAPI-G FQDN - Bancolombia's AWS instance
            port: 443,
            path: '/jwkms/apiclient/getssa',
            method: 'POST',
            cert: tlsCert,
            key: tlsPrivateKey
        };

        const req = https.request(
            ssaOptions,
            res => {
                res.on('data', function(data) {
                    logger.error("ALEXLOG: Custom End-Point Response data from getssa method is {}", data);
                    // do something with response
                    ssaJWT = data;
                });
            }
        );

        req.write(ssaContent);
        req.end();

        var reqExp = (new Date().getTime() / 1000) + 60*5;

        var dcrRequestContent = {
            claims: {
                iss: "softwareid",
                ext: reqExp,
                scope: "openid accounts payments",
                response_types: [
                    "code", "id_token"
                ],
                redirect_uris: tppRedirectUris,
                application_type: "web",
                subject_type: "pairwise",
                grant_types: [
                    "authorization_code",
                    "refresh_token",
                    "client_credentials"
                ],
                software_statement: ssaJWT,
                token_endpoint_auth_method: "private_key_jwt",
                token_endpoint_auth_signing_alg: "PS256",
                id_token_signed_response_alg: "PS256",
                request_object_signing_alg: "PS256",
                request_object_encryption_alg: "RSA-OAEP-256",
                request_object_encryption_enc: "A128CBC-HS256"
            },
            jwks: tppJwks
        }
        var dcrSignClaimsOptions = {
            hostname: sapiGFQDN, // SAPI-G FQDN - Bancolombia's AWS instance
            port: 443,
            path: '/jwkms/apiclient/signclaims',
            method: 'POST',
            cert: tlsCert,
            key: tlsPrivateKey
        };

        var dcrJWT = null;

        const req1 = https.request(
            dcrSignClaimsOptions,
            res => {
                res.on('data', function(data) {
                    logger.error("ALEXLOG: Custom End-Point Response data from signClaims method is {}", data);
                    // do something with response
                    dcrJWT = data;
                });
            }
        );

        req1.write(dcrRequestContent);
        req1.end();

        // Submit the Dynamic Client Registration Reguest and obtain the Client ID and Secret of the resulting OAuth Client.
        var dcrReqSubmitOptions = {
            hostname: sapiGFQDN, // SAPI-G FQDN - Bancolombia's AWS instance
            port: 443,
            path: '/am/oauth2/realms/root/realms/alpha/register',
            method: 'POST',
            cert: tlsCert,
            key: tlsPrivateKey,
            headers: {
                'Content-Type': "application/jwt"
            }
        };

        var clientId = null;
        var clientSecret = null;

        const req2 = https.request(
            dcrReqSubmitOptions,
            res => {
                res.on('data', function(data) {
                    logger.error("ALEXLOG: Custom End-Point Response data from oauth2/register method is {}", data);
                    // do something with response
                    clientId = data.client_id;
                    clientSecret = data.client_secret;
                });
            }
        );

        req2.write(dcrJWT);
        req2.end();

        // POST
        return {
            ssa: ssaJWT,
            clientId: clientId,
            clientSecret: clientSecret
        };
    }
    throw { code: 500, message: 'Unsupported Operation - only create method is supported.' };
}());
