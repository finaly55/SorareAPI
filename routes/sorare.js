const express = require('express');
const moment = require('moment/moment');
const { postRequest } = require("../api")
moment.locale('fr')
const fs = require('fs');

const router = express.Router();
/**
 * Get flight by Id
 */
router.get('/getAllPlayers', async (req, res) => {
  let responseInitial = {};
  let responseNext = {};

  try {
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
    const fileRead = fs.readFileSync(__dirname + '/../players.json', 'utf8');
    responseInitial = JSON.parse(fileRead);

    responseInitial = await postRequest('/federation/graphql', requestBody);
    let count = 0;

    while (
      responseInitial.data.football && responseInitial.data.football.allCards.pageInfo.hasNextPage
    ) {
      count = count + 1;
      console.log(count);

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

      responseApi = await postRequest('/federation/graphql', requestBody);
      if (responseApi.data && responseApi.data.football) {
        responseNext = responseApi

        responseInitial.data.football.allCards.nodes.push(
          ...responseNext.data.football.allCards.nodes
        );
        responseInitial.data.football.allCards.pageInfo =
          responseNext.data.football.allCards.pageInfo;
      }
    }

    // Enregistrer la réponse dans un fichier
    fs.writeFileSync(__dirname + '/../players.json', JSON.stringify(responseInitial));

    res.json(responseInitial);
  } catch (error) {
    console.log(error)
    fs.writeFileSync(__dirname + '/../players.json', JSON.stringify(responseInitial));
    res.json(responseInitial);
  }

});

router.get("/getAllSorarePlayers", async (req, res) => {
  const fileRead = fs.readFileSync(__dirname + '/../players.json', 'utf8');
  responseInitial = JSON.parse(fileRead).data.football.allCards.nodes;

  // Map pour stocker les displayName déjà rencontrés
  const displayNameMap = new Map();

  // Tableau pour stocker les objets uniques
  const objetsUniques = [];


  // Parcours du tableau d'objets
  responseInitial.forEach(objet => {
    const { player } = objet;
    const { displayName } = player;
    
    // Si le displayName n'a pas encore été rencontré, on l'ajoute au tableau des objets uniques
    if (!displayNameMap.has(displayName)) {
      displayNameMap.set(displayName, true);
      objetsUniques.push(objet);
    }
  });
  console.log(objetsUniques.length)
  res.send(objetsUniques)
})

router.get("/getAllSorarePlayersFormated", async (req, res) => {
  const fileRead = fs.readFileSync(__dirname + '/../playersUnique.json', 'utf8');
  responseInitial = JSON.parse(fileRead);

  // Tableau pour stocker les objets uniques
  const objetsUniques = [];

  // Parcours du tableau d'objets
  responseInitial.forEach(objet => {
    const { player } = objet;

    let newObject = {
      playerDisplayName: player.displayName,
      clubName: player.activeClub?.name,
      leagueName: player.activeClub?.domesticLeague?.displayName,
      photo: player.pictureUrl,
      scores: objet.so5Scores.map(entry => entry.score).join(', '),
    }
    objetsUniques.push(newObject)
  });
  res.send(objetsUniques)
})


module.exports = router;