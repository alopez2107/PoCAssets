// Display choice of journeys
// See https://cdn-icons-png.flaticon.com for example icons

var journeys = [
  { "name": "Login", "url": "Login", "icon": "128/6317/6317577.png" },
  { "name": "ID Proofing", "url": "Demo-OnFido", "icon": "128/6061/6061396.png" },
  { "name": "Remember Usernames", "url": "Demo-RememberMyUsername", "icon": "128/889/889668.png" },
  { "name": "Peer Recovery", "url": "Demo-Recovery", "icon": "128/2597/2597143.png" },
  { "name": "FingerprintJS", "url": "FingerprintJS", "icon": "/128/8337/8337702.png" },
  { "name": "FingerprintJS Pro", "url": "FingerprintProJS", "icon": "/128/8337/8337702.png" },
  { "name": "Reset Password", "url": "ResetPassword", "icon": "128/1000/1000933.png" },
  { "name": "Social Login", "url": "Demo-Social", "icon": "128/300/300221.png" },
  { "name": "SAML", "url": "Demo-SAML", "icon": "128/29/29611.png" },
  { "name": "MFA-OATH", "url": "Demo-MFA-OATH", "icon": "128/7476/7476796.png" },
  { "name": "MFA-Push", "url": "Demo-MFA-Push", "icon": "128/7476/7476796.png" },
  { "name": "Passwordless", "url": "Demo-MFA-Passwdless", "icon": "128/2767/2767146.png" },  
  { "name": "MFA-Choice", "url": "Demo-MFA-Choice", "icon": "128/7476/7476796.png" },
  { "name": "Progressive Profile", "url": "ProgressiveProfile", "icon": "128/7319/7319509.png" },
  { "name": "Age-Based Login", "url": "Demo-AgeBasedLogin", "icon": "128/3081/3081969.png" },
  { "name": "Multi Brand", "url": "Demo-MultiBrand", "icon": "128/6980/6980735.png" },
  { "name": "Anti Fraud", "url": "1-Demo-Chooser-AutoAccess", "icon": "128/2867/2867725.png" },
  
  

]


var ICONS = "https://cdn-icons-png.flaticon.com/"
var SIZE = "24";

var css = "* { box-sizing: border-box; }  .column { float: left; width: 50%; padding: 30px; text-align:left; } .row:after { content: \"\"; display: table; clear: both; } .box { display: flex; align-items: center;  height: 60px; text-decoration: none; padding: 0 10px; } .icon { height: 32px; min-width: 32px; margin-right: 10px; } a:hover { text-decoration: none; }";

var fr = JavaImporter(
    org.forgerock.openam.auth.node.api.Action,
    com.sun.identity.authentication.callbacks.ScriptTextOutputCallback
)


with(fr) {
    var script;
    function createScript() {
      	var left = "";
        var right = "";
      	for (i in journeys) {
            var elem = '<a class=\"box\" href=\"/am/XUI?realm=alpha&authIndexType=service&authIndexValue=' + journeys[i]["url"] + '\"><img class=\"icon\" src=\"' + ICONS + journeys[i]["icon"] + '\"><span>' + journeys[i]["name"] + '</span></a>';
          	if (i % 2 == 0) 
          		left += elem;
          	else 
          		right += elem;
        }
        return String("document.head.appendChild(document.createElement(\"style\")).innerHTML = '" + css + "' \n\
            var chooser = document.createElement('div'); \n\
			chooser.id = 'chooser'; \n\
            var cb = document.getElementById('callbacksPanel'); \n\
            cb.insertBefore(chooser, cb.firstChild); \n\
            chooser.innerHTML = '<div class=\"row\"><div class=\"column\">"+left+"</div><div class=\"column\">"+right+"</div></div>' \n\
            if (document.body.querySelector('button[type=submit]')) { \n\
                var b = document.body.querySelector('button[type=submit]'); \n\
				b.addEventListener(\"click\", function() { document.getElementById('chooser').remove();  }); \n\
            } \n\
        ");
    }  
  
    if (callbacks.isEmpty()) {
        action = Action.send(
            new ScriptTextOutputCallback(createScript())
        ).build()
    } else action = Action.goTo("true").build();
}