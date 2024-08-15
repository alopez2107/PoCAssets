var tppOrgId = newObject._id;
var tppOrgName = newObject.orgName;
var tppTLSCert = newObject.tlsClientCert;
var tppTLSPrivateKey = newObject.tlsPrivateKey;
var tppJwks = newObject.jwks;
var tppRedirectUri = newObject.redirectURL;

var payload = {
    orgId: tppOrgId,
    orgName: tppOrgName,
    tlsCert: tppTLSCert,
    tlsPrivateKey: tppTLSPrivateKey,
    jwks: tppJwks,
    redirectUri: tppRedirectUri
};

var params = {
    sapiGFQDN: sapiGFQDN
};

var tppClientInfo = openidm.create("endpoint/registertppclient", null, payload, params);

var tppOps = [
    {
        operation: "replace",
        field: "/ssa",
        value: tppClientInfo.ssa
    },
    {
        operation: "replace",
        field: "/client_id",
        value: tppClientInfo.clientId
    },
    {
        operation: "replace",
        field: "/client_secret",
        value: tppClientInfo.clientSecret
    }
];

try {
    openidm.patch("managed/TPPApplication/" + newObject._id, null, tppOps);
}
catch (e) {
    logger.error("ALEXLOG: Exception caught {}", e.getMessage());
}


