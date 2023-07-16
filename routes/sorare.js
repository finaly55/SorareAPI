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
                    position
                    player {
                        displayName
                        activeClub {
                            name
                            domesticLeague {
                                displayName
                            }
                        }
                        pictureUrl
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

    // Lire le contenu du fichier JSON précédemment enregistré
    const fileRead = fs.readFileSync(__dirname + '/../players.json', 'utf8');
    responseInitial = JSON.parse(fileRead);

    // Effectuer une requête POST vers l'API GraphQL pour récupérer les joueurs
    responseInitial = await postRequest('/federation/graphql', requestBody);
    let count = 0;

    // Boucler tant qu'il y a des pages suivantes à récupérer
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
                      player {
                          displayName
                          activeClub {
                              name
                              domesticLeague {
                                  displayName
                              }
                          }
                          pictureUrl
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

router.get("/getAllSorareStep2", async (req, res) => {
  const fileRead = fs.readFileSync(__dirname + '/../players.json', 'utf8');
  responseInitial = JSON.parse(fileRead).data.football.allCards.nodes;

  // Tableau pour stocker les objets uniques
  const objetsUniques = [];

  // Map pour stocker les displayName déjà rencontrés
  const displayNameMap = new Map();

  // Parcours du tableau d'objets
  responseInitial.forEach(objet => {
    const { player, so5Scores, position } = objet;

    if (!displayNameMap.has(player.displayName)) {
      displayNameMap.set(player.displayName, true);

      let newObject = {
        playerDisplayName: player.displayName,
        clubName: player.activeClub?.name,
        leagueName: player.activeClub?.domesticLeague?.displayName,
        photo: player.pictureUrl,
        scores: so5Scores.map(entry => entry.score).join(', '),
        position: position
      }
      objetsUniques.push(newObject)
    }
  });

  // Enregistrer la réponse dans un fichier JSON
  fs.writeFileSync(__dirname + '/../playersUnique.json', JSON.stringify(responseInitial));
  res.send(objetsUniques)
})


module.exports = router;