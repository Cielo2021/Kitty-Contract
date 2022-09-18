var web3 = new web3(web3.givenProvider);
var instance;
var marketPlaceInstance; 
var user;

var contractAddress = "0xccAe70e760F0E2717d437eC0562a089d3C073bC5";
//var marketPlaceAddress = "";

$(document).ready(function() {
    window.ethereum.enable().then(function(accounts){
        instance = new web3.eth.Contract(abi, contractAddress, { from: accounts[0] });
        marketPlaceInstance = new web3.eth.Contract(abi.marketplace, marketPlaceAddress, { from: accounts[0] });
        user = accounts[0];

        console.log(instance);
        console.log(marketplace);

        /*     
    EVENTS
    *   Listen for the `Birth` event, and update the UI
    *   This event is generate in the KittyBase contract
    *   when the _createKitty internal method is called
    */


        instance.events.Birth().on('data', function(event) {
            console.log(event);
            let owner = event.returnValues.owner;
            let kittenId = event.returnValues.KittenId;
            let mumId = event.returnValues.mumId;
            let dadId = event.returnValues.dadId;
            let genes = event.returnValues.genes;
            $("#kittyCreation").css("display", "block");
            $("kittyCreation").txt("owner:" + owner
                                   +"kittyId:" + kittenId 
                                   +"mumId:"  + mumId 
                                   +"dadId:" + dadId
                                   +"genes:" + genes, 'success')

        })
        .on("error", console.error);
    
        instance.events.MarketTransaction()
        .on('data', (event) => {
            console.log(event);
            var eventType = event.returnValues["TxType"].toString();
            var tokenId = event.returnValues["tokenId"]
            if (eventType == "Buy") {
                alert_msg('Successfully Kitty purchase! Now you own this Kitty tokenId: '+ tokenId, 'success')
            }
            if (eventType == "Create offer") {
                alert_msg('Successfully Offer set for Kitty id: '+ tokenId, 'success')
                $('#cancelBox').removeClass('hidden')
                $('#cancelBtn').attr('onclick', 'deleteOffer('+ tokenId + ')')
                $('#sellBtn').attr('onclick', '')
                $('sellBtn').addClass('btn-warning')
                $('#sellBtn').html('<b>For Sale at:</b>')
                var price = $('#catPrice').val()
                $('#catPrice').val(price)
                $('#catPrice').prop('readonly', true)

            }
            if(eventType == "Remove offer") {
                alert_msg('Successfully Offer for Kitty id: '+tokeId, 'success')
                $('#cancelBox').addClass('hidden')
                $('#cancelBtn').attr('onclick', '')
                $('catPrice').val('')
                $('#catPrice').prop('readonly', false)
                $('#sellBtn').removeClass('btn-warning')
                $('#sellBtn').addClass('btn-success')
                $('#sellBtn').html('<b>Sell me:</b>')
                $('#sellBtn').attr('onClick', 'sellCat('+ tokenId + ')')

            }
        })
         .on('error', console.error);
})

})

//Gen 0 cats for sale
async function initMarketplace() {
    var isMarketPlaceOperator = await instance.methods.isApprovedForAll(user, marketPlaceAddress).call();
    
    if(isMarketPlaceOperator) {
        getInventory();
    }
    else {
        await instance.methods.setApprovalForAll(marketPlaceAddress, true).send().on("receipt", function(receipt) {
            // tx done
            console.log("tx done");
            getInventory();

        })
    }
}

//Get Kitties for breeding that are not selected 
async function getInventory() {
    var arrayId = await marketPlaceInstance.methods.getAllTokenOnSale().call();
    console.log(arrayId);
    for (i = 0; i < arrayId.length; i++) {
        if(arrayId[i] !=0) {
            appendKitty(arrayId[i])

        }
    }
}

function createKitty() {
    var dnaStr = getDna();
    let res;
    try {
        res = instance.methods.createKittyGen0(dnaStr).send();
    } catch (err) {
        console.log(err);

    }
}

async function checkOffer(Id) {

    let res;
    try{
        res = await instance.methods.getOffer(Id).call();
        var price = res['price'];
        var seller = ['seller'];
        var onsale = false
        //if price more than 0 means the cat is for sale
        if (price > 0) {
            onsale = true
        }
        //Also check that it belongs to someone 
        price = web3.utils.fromWei(price, 'ether');
        var offer = {seller: seller, price: price, onsale: onsale}
        return offer 

        } catch (err) {
            console.log(err);
            return 
        }
    }


//Get all the Kitties from address  
async function KittyByOwner(address) {

    let res;
    try{
        res = await instance.methods.tokensOfOwner(address).call();
        } catch (err){
            console.log(err);
        }
}

//Gen 0 Cat for sale 
async function contractCatalog(){
    var arrayId = await instance.methods.getAllTokenOnSale().call();
    for (i = 0; i < arrayId.length; i++) {
        if(arrayId [i] != "0") {
            appendKitty(arrayId[i])
        }
    }
}

//Get Kitties of a current address 
async function myKitties() {
    var arrayID = await instance.methods.tokensOfOwner(user).call();
    for (i = 0; i < arrayId.length; i++) {
        appendKitty(arrayId[i])
    }
}

//Get Kitties for breeding that are not selected 
async function breedKitties(gender) {
    var arrayId = await instance.methods.tokensOfOwner(user).call();
    for(i = 0; i < arrayId.length; i++) {
        appendBreed(arrayId[i], gender) 
    }
}

//Checks that the user address is sam as the cat owner address
//This is to see if the user can sell this cat
async function catOwnership(id) {

    var address = await instance.methods.ownerOf(id).call();

    if(address.toLowerCase() == user.toLowerCase()) {
        return true 
    }
    return false 

}

//Appending cats to breed selection 
async function appendBreed(id, gender) {
    var kitty = await instance.methods.getKitty(id).call()
    breedAppend(kitty[0], id, kitty['generation'], gender)
}

//Appending cats to breed selection 
async function breed(dadId, mumId) {
    try{
        await instance.methods.Breeding(dadId, mumId).send()
    } catch (err) {
        log(err)
    }
}

//Appending cats for catalog
async function appendKitty(id) {
    var kitty = await instance.methods.getKitty(id).call()
    appendCat(kitty[0], id, kitty['generation'])
}


async function singleKitty(){
    var id = get_variable().catId
    var kitty = await instance.methods.getKitty(id).call()
    singleCat(kitty[0], id, kitty['generation'])
}

async function deleteOffer(Id) {
    try {
        await instance.methods.removeOffer(id).call();
    } catch (err) {
        console.log(err);
    }
    
}

async function sellcat(Id) {
    var price = $('#catPrice').val()
    var amoount = web3.utils.toWei(price, "ether")
    try {
        await instance.methods.setOffer(amount, id).send();
    } catch (err){
        console.log(err);
    }
}

async function buyKitten(id, price) {
    var amount = web3.utils.toWei(price, "ether")
    try{
        await instance.methods.buyKitten(id).send({value: amount});
        } catch (err) {
            console.log(err);
        }
    }

    async function totalCats(){
        var cats = await instance.methods.totalsuply().call();
    }

