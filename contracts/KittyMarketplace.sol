// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Kittycontract.sol";
import "./Ownable.sol";
import "./IKittyMarketplace.sol";

contract KittyMarketplace is Ownable, IKittyMarketPlace {
    Kittycontract private _kittyContract;

    struct Offer {
        address payable seller;
        uint256 price;
        uint256 index;
        uint256 tokenId;
        bool active;
    }
    Offer[] offers;

    event MarketTransaction(string TxType, address owner, uint256);

     mapping(uint256 => Offer) tokenIdToOffer;

     function setKittyContract(address _kittyContractAddress) public onlyowner {
         _kittyContract = kittycontract(_kittyContractAddress);
     }
     constructor(address _kittyContractAddress) public {
         setKittyContract(_kittyContractAddress);
     }

     function getOffer(uint256 _tokenId)
     public
     view
     returns
( 
    address seller, 
    uint256 price,
    uint256 index, 
    uint256 tokenId, 
    bool active

) {
    Offer storage offer = tokenIdToOffer[_tokenId];
    return (
        offer.seller,
        offer.price,
        offer.index,
        offer.tokenId,
        offer.active
    );
}

function getAllTokenOnSale() public returns(uint256[] memory listOfOffers) {
    uint256 totalOffers = offers.lenght;

    if (totalOffers == 0){
        return new uint256[](0);
    }else 

        uint256[] memory result = new uint256[](totalOffers);

        uint256 offerId;

        for(offerId = 0; offerId < totalOffers; offerId++){
            if (offers[offerId].active == true){
                result[offerId] = offers[offerId].tokenId;
            }
        }
        return result;
    }
}

    function _ownsKitty(address _address, uint256 _tokenId)
        internal
        view
        returns (bool)
    
    {
        return (_kittyContract.ownerOf(tokenId) == _address);

    }

    /*
     * create a new offer based for the given tokenId and price
     */ 
    function setOffer(uint256 _price, uint256 _tokenId) public {
        require (
            _ownsKitty(msg.sender, _tokenId),
            "You are not the true owner of the kitty"
        );
        require(tokenIdToOffer[_tokenId].active == false, "You can't sell twice the same offers");
        require(_kittyContract.isApprovedForAll(msg.sender, address(this)), "Contract needs to be approved to transfer the kitty in the future");
        
        Offer memory _offer = Offer ({
            seller: msg.sender, 
            price: _price, 
            active: true,
            tokenId: _tokenId,
            index: offers.length
        });

        tokenIdToOffer[_tokenId] = _offer;
        offers.push(_offer);

        emit MarketTransaction("Create offer", msg.sender, _tokenId);
    }

    /*
    * Remove an existing offers
    */
    function removeOffer(uint256 _tokenId) public {
        Offer memory offer = tokenIdToOffer[_tokenId];
        require(
            offer.seller == msg.sender,
            "You are not the seller of that kitty"
        );

        delete tokenIdToOffer[_tokenId];
        offers[tokenIdToOffer[_tokenId].index].active = false;

        emit MarketTransaction("Rmove offer", msg.sender, _tokenId);
    }

    /*
    * Accept an offer and buy the kitty
    */ 
    function buyKitty(uint256 _tokenId) public payable {
        Offer memory offer = tokenIdToOffer[_tokenId];
        require(msg.value == offer.price, "The price is incorrect");
        require(tokenIdToOffer[_tokenId].active == true, "No active order present");

        //Important: delete the kitty from the mapping BEFORE paying out to prevent reentry attacks 
        delete tokenIdToOffer[_tokenId];
        offers[offer.index].active = false;

        //Transfer the funds to the seller
        // To do: make this logic pull instead of push
        if(offer.price> 0) {
            offer.seller.transfer(offer.price);
        }

        //Transfer ownership of the kitty
        _kittyContract.transferFrom(offer.seller, msg.sender, _tokenId);

        emit MarketTransaction("Buy", msg.sender, _tokenId);
    }


