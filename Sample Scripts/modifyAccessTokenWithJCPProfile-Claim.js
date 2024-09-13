/*
 * Copyright 2019-2023 ForgeRock AS. All Rights Reserved.
 *
 * Use of this code requires a commercial software license with ForgeRock AS
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
 * This script lets you modify information associated with an OAuth2 access token
 * with methods provided by the AccessToken (1) interface.
 * The changes made to OAuth2 access tokens will directly impact the size of the CTS tokens,
 * and, similarly, the size of the JWTs if client-based OAuth2 tokens are utilized.
 * When adding/updating fields make sure that the token size remains within client/user-agent limits.
 *
 * Defined variables:
 * accessToken - AccessToken (1).
 *               The access token to be updated.
 *               Mutable object, all changes to the access token will be reflected.
 * scopes - Set<String> (6).
 *          Always present, the requested scopes.
 * requestProperties - Unmodifiable Map (5).
 *                     Always present, contains a map of request properties:
 *                     requestUri - The request URI.
 *                     realm - The realm that the request relates to.
 *                     requestParams - A map of the request params and/or posted data.
 *                                     Each value is a list of one or more properties.
 *                                     Please note that these should be handled in accordance with OWASP best practices:
 *                                     https://owasp.org/www-community/vulnerabilities/Unsafe_use_of_Reflection.
 * clientProperties - Unmodifiable Map (5).
 *                    Present if the client specified in the request was identified, contains a map of client properties:
 *                    clientId - The client's URI for the request locale.
 *                    allowedGrantTypes - List of the allowed grant types (org.forgerock.oauth2.core.GrantType) for the client.
 *                    allowedResponseTypes - List of the allowed response types for the client.
 *                    allowedScopes - List of the allowed scopes for the client.
 *                    customProperties - A map of the custom properties of the client.
 *                                       Lists or maps will be included as sub-maps; for example:
 *                                       customMap[Key1]=Value1 will be returned as customMap -> Key1 -> Value1.
 *                                       To add custom properties to a client, update the Custom Properties field
 *                                       in AM Console > Realm Name > Applications > OAuth 2.0 > Clients > Client ID > Advanced.
 * identity - AMIdentity (3).
 *            Always present, the identity of the resource owner.
 * session - SSOToken (4).
 *           Present if the request contains the session cookie, the user's session object.
 * scriptName - String (primitive).
 *              Always present, the display name of the script.
 * logger - Always present, the "OAuth2Provider" debug logger instance:
 *          https://backstage.forgerock.com/docs/am/7/scripting-guide/scripting-api-global-logger.html#scripting-api-global-logger.
 *          Corresponding log files will be prefixed with: scripts.OAUTH2_ACCESS_TOKEN_MODIFICATION.
 * httpClient - HTTP Client (8).
 *              Always present, the HTTP Client instance:
 *              https://backstage.forgerock.com/docs/am/7/scripting-guide/scripting-api-global-http-client.html#scripting-api-global-http-client.
 *
 * Return - no value is expected, changes shall be made to the accessToken parameter directly.
 *
 * Class reference:
 * (1) AccessToken - https://backstage.forgerock.com/docs/am/7/apidocs/org/forgerock/oauth2/core/AccessToken.html.
 * (3) AMIdentity - https://backstage.forgerock.com/docs/am/7/apidocs/com/sun/identity/idm/AMIdentity.html.
 * (4) SSOToken - https://backstage.forgerock.com/docs/am/7/apidocs/com/iplanet/sso/SSOToken.html.
 * (5) Map - https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/HashMap.html,
 *           or https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/LinkedHashMap.html.
 * (6) Set - https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/HashSet.html.
 * (8) Client - https://backstage.forgerock.com/docs/am/7/apidocs/org/forgerock/http/Client.html.
 */


(function () {
    
    // Adds new fields containing the session property values.
    // NOTE: session may not be available for non-interactive authorization grants.
    if (session) {
        try {
            logger.error("jcpProfile from Session Property is {}", session.getProperty("jcpProfile"));
            var jcpProfile = JSON.parse(session.getProperty("jcpProfile"));
            accessToken.setField('selectedCompany', jcpProfile.selectedCompany);
            accessToken.setField("affiliate", jcpProfile.affiliate);
            accessToken.setField('companyType', jcpProfile.companyType);
            accessToken.setField('roles', jcpProfile.roles);
            
        } catch (e) {
            logger.error('Unable to retrieve session property value. ' + e);
        }
    }

    // Removes a native field from the token entry, that was set by AM.
    // WARNING: removing native fields from the token may result in loss of functionality.
    // accessToken.removeTokenName()

    // No return value is expected. Let it be undefined.
}());