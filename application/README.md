## Api pour la gestion des entrees d'un journale

# cette api permet de gerrer les entrees d'un journale comme ajouter, modifier et supprimer le journale ainsi 
# la creation dun utilisateur, la modification de ses informations et sa suppression

## Deffirents fonctionnalitees

# inscreption d'un nouveau utilisateur 
# connexion d'un utilisateur vers la base de donnes avec ses information avec la verification du mot de passe hacher
# possibbilite de supprimer un utilisateur 
# ajout d'un journal
# modification d'un journal
# suppression d'un journal

## ce qu'il faut pour que l'Api fonction

# on rentre dans le projet ou on veut creer l'api
# on install les differents module 
 # npm install express mysql jsonwebtoken bcrypt

# Apres la creation on lance l'api avec la command node app.js

## Fonctionnement de l'Api

# pour l'emregistrement on selection la methode post et dans le body on met les informations necissaire pour l'ajout d'un utilisateur sous format json
# {
#    "nom":"adem","email":"adem@aa.com","mot_de_passe":"aloaloalao"
# }

# connexion d'un utilisateur : il faut saisir email et mot de passe et cela va etre verifier si ce sont les bonnes informations l'utilisateur va se connecter sur la base de donnes 

# pour modifier les imformation de l'utilisateur on doit utiliser la method put et dans le Header on doit mettre key sur autorization et value : Bearer token et dans le body on met les information modifier 

# ajout d'un journal avec la methode post on rempli les informations du journale dans le body et dans le header la meme chose key et value qui contien le token de l'utilisateur qui veut ajouter le journal

# modifier le journal meme chose avec la method put le header avec les meme informations et le body avec les vouvelles informations a mettre mais dans l'url on doit rajouter le id du journal a modifier

# pour la suppression du journal on choisi le methode delete avec les meme specifications pour la modification 


# pour lajout de la page sa modification et sa suppression c la meme chose que le journale juste dans la creation on doit mettre le id du hournale ou on doit ajouter la page et lors de sa supression in doit ajouter id de la oage a supprimer dans l'url