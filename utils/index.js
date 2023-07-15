const moment = require('moment/moment');
moment.locale('fr')

function groupBy(arr, prop, general) {
    const map = new Map(Array.from(arr, obj => [obj[prop], []]));
    arr.forEach(obj => map.get(obj[prop]).push(obj));
    return {
        general:  general,
        result: Array.from(map.values())[0] ? Array.from(map.values())[0] : []
    };
}

function toUrl(url) {
    const baseURL = "https://www.skyscanner.net/g/"
    const apikey = "?apikey=6f4cb8367f544db99cd1e2ea86fb2627"
    return url = baseURL + url + apikey
}

function toDate(stringDate) {
    return stringDate.split("*")[4];
}

function toDateMoment(stringDate) {
    return moment(stringDate, "YYYYMMDD")
}

function addDateString(stringDate, nbDays) {
    return moment(stringDate, "YYYYMMDD").add(nbDays, "days").format("YYYYMMDD")
}

function toPriceDays(data, url) {
    return data.PriceGrids.Grid[0].map(element => {
        if(element.hasOwnProperty("Direct")) {
            return {
                direct : true,
                url: url,
                date : toDate(data.Traces[element.Direct.TraceRefs[0]]),
                price : element.Direct.Price
            }
        }
    }).filter(x => x)
}

/**
 * Cette fonction prend une date au format string et un nombre de jours à ajouter
 * et renvoie le nombre de jours de congés ouvrables (jours non week-end et non fériés en France)
 * à partir de la date initiale, en tenant compte des jours fériés français.
 *
 * @param {string} stringDate - La date initiale au format "YYYYMMDD".
 * @param {number} nbAddDays - Le nombre de jours à ajouter.
 * @returns {number} Le nombre de jours de congés ouvrables à partir de la date initiale.
 */
function dateToConges(stringDate, nbAddDays) {
    let nbDaysConges = 0
    let dateAddDays = null
    for (let day = 0; day <= nbAddDays; day++) {
        let date = moment(stringDate, "YYYYMMDD")
        dateAddDays = date.add(day, 'days')

        if(dateAddDays.day() != 6 && dateAddDays.day() != 0) {
            nbDaysConges += 1
        }
    }

    // Ajout des jours fériés français
    const publicHolidays = [
        "0101", // Jour de l'an
        "1004", // Fête du Travail
        "0805", // Victoire 1945
        "1805", // Victoire 1945
        "2905", // Pentecôte
        "1407", // Fête Nationale
        "1508", // Assomption
        "0111", // Toussaint
        "1111", // Armistice
        "2512", // Noël
    ];

    publicHolidays.forEach(holiday => {
        if (moment(holiday, "DDMM").isSame(moment(dateAddDays))) {
            nbDaysConges += 1;
        }
    });
    
    return nbDaysConges;
}

function parseDateObject(str) {
    const year = parseInt(str.slice(0, 4));
    const month = parseInt(str.slice(4, 6));
    const day = parseInt(str.slice(6, 8));
    return { year, month, day };
  }

module.exports = { groupBy, dateToConges, toPriceDays, addDateString, toDateMoment, toUrl, parseDateObject };