var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
var Battle = require('./Battle');

// RETURNS ALL Battles
router.get('/', function (req, res) {
    Battle.find({}, function (err, battles) {
        if (err) return res.status(500).send("There was a problem finding the data.");
        //console.log(battles);
        res.status(200).send(battles);
    });
});

// returns list(array) of all the places where battle has taken place.
router.get('/list', function (req, res) {
    Battle.distinct( "location" , { "location" : { $nin : ["", null] } })
    .then(locations => {
        res.status(200).send(locations);
    })
    .catch(err => {
        console.log(err);
        if (err) return res.status(500).send("There was a problem finding the data.");
    })
});

// returns total number of battle occurred.
router.get('/count', function (req, res) {
    Battle.countDocuments({}, function (err, count) {
        if (err) return res.status(500).send("There was a problem finding the data.");
        //console.log(battles);
        res.status(200).send(count.toString());
    });
});

// returns stats.
// {
//     'most_active':{
//         'attacker_king',
//         'defender_king',
//         'region',
//         'name'
//     },
//     'attacker_outcome':{
//         'win', // total win
//         'loss' // total loss
//     },
//     'battle_type':[], // unique battle types
//     'defender_size':{
//         'average',
//         'min',
//         'max'
//     }
// }
router.get('/stats', function (req, res) {

    function getMostActiveStats(attribute) {
        return Battle.aggregate([
            { "$match": { [attribute]: { "$exists": true, "$ne": null } } },
            { $group: {
                    _id: `$${attribute}`,
                    count: { $sum: 1 }
                }
            },
            { $group: {
                    _id: '$count',
                    names: {$push: '$_id'}
                }
            },
            {$sort : {_id : -1}}
            ,{$limit : 1 }
            ,{ $project: { count: '$_id', _id: 0, names: 1} }
        ]);
    }
    let mostActiveAttacker = getMostActiveStats('attacker_king');
    let mostActiveDefender = getMostActiveStats('defender_king');
    let mostActiveRegion = getMostActiveStats('region');
    let mostActiveName = getMostActiveStats('name');

    let attackerOutcomeStats = Battle.aggregate([
        { "$match": { "attacker_outcome": { "$exists": true, "$ne": null } } },
        {"$group":{
            _id: 'attacker_outcome',
            win: {
                "$sum": { "$cond": [ { "$eq": [ "$attacker_outcome", 'win' ] }, 1, 0 ] }
            },
            loss: {
                "$sum": { "$cond": [ { "$eq": [ "$attacker_outcome", 'loss' ] }, 1, 0 ] }
            }
        }},
        { $project: { _id: 0} }
    ]);

    let battleTypes = Battle.distinct( "battle_type" , { "battle_type" : { $nin : ["", null] } });

    let defenderStats = Battle.aggregate([
        { "$match": { "defender_size": { "$exists": true, "$ne": null } } },
        { $group: {
                _id: null,
                average: { $avg: '$defender_size' },
                min: { $min: '$defender_size' },
                max: { $max: '$defender_size' }
            }
        },
        { $project: { _id: 0, average: { $ceil: '$average' }, min: 1, max: 1} }
    ]);

    Promise.all([defenderStats,
        mostActiveAttacker,
        mostActiveDefender,
        mostActiveRegion,
        mostActiveName,
        attackerOutcomeStats,
        battleTypes
    ])
    .then(results => {
        res.status(200).send({
            defender_size: results[0],
            most_active: {
                attacker_king: results[1],
                defender_king: results[2],
                region: results[3],
                name: results[4]
            },
            battle_type: results[6],
            attacker_outcome: results[5]
        });
    })
    .catch(err => {
        console.log(err);
        if (err) return res.status(500).send("There was a problem finding the data.");
    });
});

// searches for provided input
// /search?king=Robb Stark&location=Riverrun&type=siege 
router.get('/search', function (req, res) {
    const query = req.query;
    let searchParameters = [];
    for (let key in query) {
        switch(key) {
            case 'king':
            case 'commander': {
                    searchParameters.push({$or: [{['attacker_' + key] : query[key]}, {['defender_' + key]: query[key]}]});
                }            
                break;
            case 'type': {
                    searchParameters.push({'battle_type': query.type});
                }
                break;
            default:
                searchParameters.push({[key]: query[key]});
        }
    }

    Battle.find({$and: searchParameters}, function (err, battles) {
        if (err) return res.status(500).send("There was a problem finding the data.");
        res.status(200).send(battles);
    });
});

module.exports = router;