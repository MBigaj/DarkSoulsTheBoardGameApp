## A project that revolves around Dark Souls The Board Game.
All information about cards, tiles and encounters in one place, create custom encounters, randomize them, check your own builds

mikolajbigaj00
dOEpTlJQBbbhqKBC

{
    "set": "Tomb of Giants",
    "type": "gear",
    "image_path": "some/image/path.jpg",
    "details": {
        "attack": 10,
        "cost": 15,
    },
}

card types: 
    Item cards - types [ blacksmith, class starters, class bound, boss drops ]
        shared: stat requirements, slot [ hand, armour, trinket ], item type [ treasure, class starter, class bound, boss drop ], rarity, description
            hand and armour: physical block value, magical block value, dodge value, upgrade slots
                hand: range, attacks[], size [ one-handed, two-handed ]
                armour: -
            trinket: -

    Event cards

    Encounter cards

    Enemy attack cards [ boss, normal enemy ]

{
    "name": "Black Knight Sword",
    "set": "Tomb of Giants",
    "cardType": "item",
    "imagePath": "BlackKnightSword.jpg",
    "details": {
        "statRequirements": {
            "strength": 20,
            "dexterity": 23,
            "intelligence": 0,
            "faith": 0
        },
        "slot": "hand",
        "itemType": "treasure",
        "rarity": "common",
        "description": null,
        "physicalDamageBlockValue": {
            "value": 0,
            "dieType": null
        },
        "magicDamageBlockValue": {
            "value": 0,
            "dieType": null
        },
        "dodgeValue": 0,
        "upgradeSlots" : 1,
        "range": 0,
        "weaponType": "one-handed",
        "attacks": [
            {
                "staminaCost": 0,
                "damageType": "physical",
                "targetAll": false,
                "push": false,
                "repeatAttack": 0,
                "damageModifier": 0,
                "statusAliment": null,
                "shaft": false,
                "additionalMovement": 0,
                "specificRange": null,
                "attackSequence": [
                    {
                        "dieType": "black",
                        "throws": 2
                    }
                ]
            },
            {
                "staminaCost": 4,
                "damageType": "physical",
                "targetAll": false,
                "push": false,
                "repeatAttack": 0,
                "damageModifier": 0,
                "statusAliment": null,
                "shaft": false,
                "additionalMovement": 0,
                "attackSequence": [
                    {
                        "dieType": "blue",
                        "throws": 2
                    },
                    {
                        "dieType": "black",
                        "throws": 1
                    }
                ]
            }
        ]
    }
}