const express = require('express');
const moment = require('moment/moment');
const { postRequest } = require("../api")
moment.locale('fr')
const fs = require('fs');

const router = express.Router();

// Définir la route GET '/getAllPlayers'
router.get('/getAllPlayers', async (req, res) => {
  // Initialiser les objets de réponse
  let responseInitial = {};
  let responseNext = {};

  try {
    // Définir la requête GraphQL à envoyer à l'API
    const requestBody = {
      query: `
      query Football {
        football {
            allCards(rarities: [unique]) {
                nodes {
                    player {
                        displayName
                        age
                        activeClub {
                            name
                            domesticLeague {
                                displayName
                            }
                        }
                             gameStats(last: 10){
                            gameStarted
                                      }
                    }
                    so5Scores(last: 30) {
                      score
                                    }
                    position
                }
                pageInfo {
                    endCursor
                    hasNextPage
                    hasPreviousPage
                    startCursor
                }
            }
        }
    }`
    };

    // Lire le contenu du fichier JSON précédemment enregistré
    const fileRead = fs.readFileSync(__dirname + '/../players.json', 'utf8');
    responseInitial = JSON.parse(fileRead);

    // Effectuer une requête POST vers l'API GraphQL pour récupérer les joueurs
    responseInitial = await postRequest('/federation/graphql', requestBody);
    let count = 0;

     //Boucler tant qu'il y a des pages suivantes à récupérer
    while (
      responseInitial.data.football && responseInitial.data.football.allCards.pageInfo.hasNextPage
    ) {
      count = count + 1;
      console.log(count);

      // Définir la requête GraphQL pour la page suivante
      const requestBody = {
        query: `
        query Football {
          football {
              allCards(
                rarities: [unique],
                after: "${responseInitial.data.football.allCards.pageInfo.endCursor}"
                ) {
                  nodes {
                      position
                      player {
                          displayName
                          gameStats(last: 10){
                            gameStarted
                          }
                          age
                          activeClub {
                              name
                              domesticLeague {
                                  displayName
                              }
                          }
                          
                      }
                      so5Scores(last: 30) {
                          score
                      }
                      
                  }
                  pageInfo {
                      endCursor
                      hasNextPage
                      hasPreviousPage
                      startCursor
                  }
              }
          }
      }`
      };

      // Effectuer une requête POST pour récupérer la page suivante de joueurs
      responseApi = await postRequest('/federation/graphql', requestBody);
      if (responseApi.data && responseApi.data.football) {
        responseNext = responseApi

        // Ajouter les joueurs de la page suivante à la liste de joueurs
        responseInitial.data.football.allCards.nodes.push(
          ...responseNext.data.football.allCards.nodes
        );
        // Mettre à jour les informations de pagination
        responseInitial.data.football.allCards.pageInfo =
          responseNext.data.football.allCards.pageInfo;
      }
    }

    // Enregistrer la réponse dans un fichier JSON
    fs.writeFileSync(__dirname + '/../players.json', JSON.stringify(responseInitial));

    // Renvoyer la réponse au client
    res.json(responseInitial);
  } catch (error) {
    console.log(error)
    // En cas d'erreur, enregistrer la réponse initiale dans le fichier JSON
    fs.writeFileSync(__dirname + '/../players.json', JSON.stringify(responseInitial));
    // Renvoyer la réponse initiale au client
    res.json(responseInitial);
  }
});

// Définition de la route "/getAllPlayersgetAllPlayersStep2" avec une fonction asynchrone qui gère la requête et la réponse
router.get("/getAllPlayersStep2", async (req, res) => {
  // Lecture du contenu du fichier "players.json" de manière synchrone
  const fileRead = fs.readFileSync(__dirname + '/../players.json', 'utf8');

  // Analyse du contenu JSON et extraction de la propriété "data.football.allCards.nodes"
  const responseInitial = JSON.parse(fileRead).data.football.allCards.nodes;

  // Tableau pour stocker les objets uniques
  const objetsUniques = [];

  // Map pour stocker les displayName déjà rencontrés
  const displayNameMap = new Map();

  // Parcours du tableau d'objets
  responseInitial.forEach(objet => {
    // Extraction des propriétés player, so5Scores et position de l'objet en utilisant la déstructuration
    const { player, so5Scores, position, } = objet;

    // Vérification si le displayName du joueur n'est pas déjà présent dans la map displayNameMap
    if (!displayNameMap.has(player.displayName)) {
      // Ajout du displayName du joueur à la map displayNameMap pour indiquer qu'il a été rencontré
      displayNameMap.set(player.displayName, true);

      // Création d'un nouvel objet contenant les propriétés souhaitées
      let newObject = {
        playerDisplayName: player.displayName,
        gameStarted: player.gameStats?.map(entry => entry.gameStarted).join(', '),
        clubName: player.activeClub?.name,
        leagueName: player.activeClub?.domesticLeague?.displayName,
        age: player.age,  
        scores: so5Scores.map(entry => entry.score).join(','),
        position: position,
              
      };

      // Ajout du nouvel objet au tableau objetsUniques
      objetsUniques.push(newObject);
    }
  });

  // Enregistrement de la réponse dans un fichier JSON
  fs.writeFileSync(__dirname + '/../playersUniqueFormated.json', JSON.stringify(objetsUniques));

  // Renvoi des objets uniques en tant que réponse à la requête
  res.send(objetsUniques);
});

module.exports = router;