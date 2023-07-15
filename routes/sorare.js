const express = require('express');
const moment = require('moment/moment');
const { postRequest } = require("../api")
moment.locale('fr')
const fs = require('fs');
const path = require('path');

const router = express.Router();
/**
 * Get flight by Id
 */
router.get('/getAllPlayers', async (req, res) => {
  let responseInitial = {};
  let responseNext = {};
  let retryCount = 0;

  try {
    const requestBody = {
      query: `
      query Football {
        football {
            allCards(rarities: [unique]) {
                nodes {
                    position
                    player {
                        id
                        displayName
                        activeClub {
                            name
                            domesticLeague {
                                displayName
                            }
                        }
                        pictureUrl
                        slug
                    }
                    name
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
                      position
                      player {
                          id
                          displayName
                          activeClub {
                              name
                              domesticLeague {
                                  displayName
                              }
                          }
                          pictureUrl
                          slug
                      }
                      name
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

      responseApi = await postRequest('/federation/graphql', requestBody);
      if (responseApi.data && responseApi.data.football) {
        responseNext = responseApi

        responseInitial.data.football.allCards.nodes.push(
          ...responseNext.data.football.allCards.nodes
        );
        responseInitial.data.football.allCards.pageInfo =
          responseNext.data.football.allCards.pageInfo;

        if (count % 300 === 0) {
          // Ajouter un délai de 10 seconde toutes les 300 requêtes
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
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

router.get("/getAllSorareDataPlayers", async (req, res) => {
  const fileRead = fs.readFileSync(__dirname + '/../allPlayersSoRareData.json', 'utf8');
  responseInitial = JSON.parse(fileRead);

  console.log(responseInitial.data.football.allCards.nodes.length)
  res.send(responseInitial)
})

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


router.get('/compressAllPlayers', async (req, res) => {
  function mergeAuctionsData(folderPath, callback) {
    // Tableau pour stocker les données fusionnées
    const mergedAuctions = [];

    // Récupérer la liste des fichiers dans le dossier
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error('Erreur lors de la lecture du dossier :', err);
        callback(err, null);
        return;
      }

      let processedFiles = 0;

      // Parcourir chaque fichier du dossier
      files.forEach((file) => {
        const filePath = path.join(folderPath, file);

        // Ignorer les dossiers
        if (fs.lstatSync(filePath).isDirectory()) {
          console.log(`Ignorer le dossier : ${filePath}`);
          return;
        }

        // Lire le contenu du fichier
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(`Erreur lors de la lecture du fichier ${filePath} :`, err);
            callback(err, null);
            return;
          }

          try {
            // Parser les données JSON
            const fileData = JSON.parse(data);

            // Vérifier si le fichier contient la propriété "auctions"
            if (fileData.hasOwnProperty('auctions') && Array.isArray(fileData.auctions)) {
              // Ajouter les éléments de "auctions" au tableau fusionné
              mergedAuctions.push(...fileData.auctions);
            }
          } catch (error) {
            console.error(`Erreur lors du traitement du fichier ${filePath} :`, error);
          }

          // Afficher le nom du fichier en cours de traitement
          console.log(`Traitement du fichier : ${filePath}`);

          // Incrémenter le compteur des fichiers traités
          processedFiles++;

          // Vérifier si tous les fichiers ont été traités
          if (processedFiles === files.length) {
            // Renvoyer le tableau fusionné via le callback
            callback(null, mergedAuctions);
          }
        });
      });
    });
  }

  // Exemple d'utilisation de la fonction
  const folderPath = './allPlayersFiles';

  mergeAuctionsData(folderPath, (err, mergedAuctions) => {
    if (err) {
      console.error('Erreur lors de la fusion des données :', err);
      return;
    }

    console.log('Fusion des données terminée.');
    console.log('Données fusionnées :', mergedAuctions);
    res.send(mergedAuctions)
  });
})

module.exports = router;