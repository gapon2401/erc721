import { task } from "hardhat/config";

task("deploy").setAction(async function (_, { ethers, run }) {
  console.log("Start deploying");
  try {
    // The path to token metadata
    const baseUri = "https://my-domain.com/collection/metadata/";
    const _name = "My ERC721 name";
    const _symbol = "MyERC721Symbol";
    const ERC721Contract = await ethers.getContractFactory("ERC721Contract");
    const erc721Contract = await ERC721Contract.deploy(baseUri, _name, _symbol);

    await erc721Contract.deployed();

    console.log("Contract deployed to address:", erc721Contract.address);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
