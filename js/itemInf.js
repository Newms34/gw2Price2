app.factory('itemInf', function($rootScope) {
    return {
        getInfo: function(recs, scope, q) {
            var recArr = [];
            for (var i = 0; i < recs.length; i++) {
                //get item data from https://api.guildwars2.com/v2/items/
                recArr.push($.ajax({
                    url: 'https://api.guildwars2.com/v2/items/' + recs[i].output_item_id,
                    type: 'GET',
                    dataType: 'json'
                }))
            }
            q.all(recArr).then(function(itemInfos) {
                    //so now, for each item type (rune, armor, etc), we need to convert the details into an array.
                    //this is already pretty much done for runes
                for (var j = 0; j < itemInfos.length; j++) {
                    var attribs = [];
                    var desc = itemInfos[j].description ? itemInfos[j].description : '';
                    if (itemInfos[j].details && itemInfos[j].details.type.toLowerCase() == 'rune') {
                        //rune
                        attribs = itemInfos[j].details.bonuses;
                        console.log(itemInfos[j].name, 'is a Rune!')
                    } else if (itemInfos[j].details && itemInfos[j].details.type.toLowerCase() == 'sigil') {
                        //sigil
                        //attribs either itemInfos[j].details.infix_upgrade.buff.description
                        attribs = [itemInfos[j].details.infix_upgrade.buff.description]
                        console.log(itemInfos[j].name, 'is a Sigil!')
                    } else if (itemInfos[j].type && itemInfos[j].type.toLowerCase() == 'armor') {
                        //armor
                        itemInfos[j].details.infix_upgrade.attributes.forEach(function(att) {
                            attribs.push(att.attribute + ' ' + att.modifier);
                        });
                        console.log(itemInfos[j].name, 'are boots!')
                    } else if (itemInfos[j].type && itemInfos[j].type.toLowerCase() == 'weapon') {
                        //weapon
                        itemInfos[j].details.infix_upgrade.attributes.forEach(function(att) {
                            attribs.push(att.attribute + ' ' + att.modifier);
                        });
                        console.log(itemInfos[j].name, 'is a weapon!')
                    } else if (itemInfos[j].type && itemInfos[j].type.toLowerCase() == 'consumable') {
                        //cons
                        attribs = itemInfos[j].details.description? itemInfos[j].details.description.split('\r'):[' '];
                        console.log(itemInfos[j].name, 'is a consumable!')
                    } else {
                        console.log('Not sure what ', itemInfos[j].name, 'is, but details:', (itemInfos[j].details || itemInfos[j].type), ', and description:', itemInfos[j].description)
                    }
                    //now we normalize any flavor text or reminder text
                    attribs = attribs.join('#').replace(/(<\/c> <br>)/g, '</c>').replace('\n', '#'); //temporarily join all stuff. eliminate brs
                    attribs = attribs.split(/#|<\/c>|<c=@flavor>|<c=@reminder>|\n|\r/g);
                    for (var k=0; k<recs.length;k++){
                        if (recs[k].output_item_id==itemInfos[j].id){
                            recs[k].blurbAttribs = attribs;
                            recs[k].blurbDesc = desc;
                        }
                    }
                }
                console.log(recs)
                //now all the items have descriptions. woopie
                scope.working = false;
            })
        }
    };
});
