// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Contract is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mint price - 0.1 ETH
    uint256 public constant PRICE = 100000000000000000;

    string private baseURI;

    constructor(string memory _baseTokenURI, string memory _name, string memory _symbol)
    ERC721(_name, _symbol) {
        baseURI = _baseTokenURI;
    }

    /**
     * @notice Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable {}

    /**
     * @notice Mint only for owner
     */
    function mintByOwner(address to, string calldata tokenUri) external onlyOwner
    {
        uint256 newItemId = _tokenIds.current();
        _tokenIds.increment();

        _safeMint(to, newItemId);
        _setTokenURI(newItemId, tokenUri);
    }


    /**
     * @notice Public mint
     */
    function mint() external payable
    {
        require(PRICE <= msg.value, "INVALID_PRICE");

        uint256 newItemId = _tokenIds.current();
        _tokenIds.increment();
        _safeMint(msg.sender, newItemId);

        // Return money, if sender have sent more than 0.1 ETH
        if (msg.value > PRICE) {
            Address.sendValue(payable(msg.sender), msg.value - PRICE);
        }
    }

    /**
     * @notice Read the base token URI
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @notice Update the base token URI
     */
    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
    }

    /**
     * @notice Allow withdrawing funds
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        Address.sendValue(payable(msg.sender), balance);
    }

    // The following functions are overrides required by Solidity.
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @notice Add json extension to all token URI's
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return string(abi.encodePacked(super.tokenURI(tokenId), '.json'));
    }
}
