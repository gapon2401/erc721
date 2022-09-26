import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ERC721Contract } from "../typechain-types";
import { expect } from "chai";

interface Signers {
  admin: SignerWithAddress;
  user: SignerWithAddress;
}

describe("ERC721Contract", function () {
  before(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user = signers[1];

    this.baseUri = "https://my-domain.com/collection/metadata/";
  });

  beforeEach(async function () {
    const _name = "My ERC721 name";
    const _symbol = "MyERC721Symbol";

    const ERC721ContractFactory = await ethers.getContractFactory(
      "ERC721Contract"
    );

    this.contract = <ERC721Contract>(
      await ERC721ContractFactory.deploy(this.baseUri, _name, _symbol)
    );

    await this.contract.deployed();
  });

  it("Mint 5 tokens by owner", async function () {
    await this.contract.mintByOwner(
      this.signers.user.address,
      "link_to_token_json1"
    );
    await this.contract.mintByOwner(
      this.signers.user.address,
      "link_to_token_json2"
    );
    await this.contract.mintByOwner(
      this.signers.user.address,
      "link_to_token_json3"
    );
    await this.contract.mintByOwner(
      this.signers.user.address,
      "link_to_token_json4"
    );
    await this.contract.mintByOwner(
      this.signers.user.address,
      "link_to_token_json5"
    );

    // Check balance of the user
    expect(await this.contract.balanceOf(this.signers.user.address)).to.equal(
      5
    );
  });

  it("Revert, if user is trying to use mintByOwner", async function () {
    expect(
      this.contract
        .connect(this.signers.user)
        .mintByOwner(this.signers.user.address, "link_to_token_json1")
    ).to.be.reverted;
  });

  it("Mint token by user", async function () {
    await this.contract
      .connect(this.signers.user)
      .mint({ value: ethers.utils.parseEther("0.1") });

    expect(await this.contract.balanceOf(this.signers.user.address)).to.equal(
      1
    );
  });

  it("Should revert INVALID_PRICE", async function () {
    expect(
      this.contract
        .connect(this.signers.user)
        .mint({ value: ethers.utils.parseEther("0.05") })
    ).to.be.revertedWith("INVALID_PRICE");
  });

  it("Should return back overpaid eth to sender", async function () {
    const price = ethers.utils.parseEther("0.1");
    expect(
      this.contract
        .connect(this.signers.user)
        .mint({ value: ethers.utils.parseEther("1.5") })
    ).to.changeEtherBalances(
      [this.signers.user, this.contract],
      [price.mul(-1), price]
    );
  });

  it("Check receiving eth to contract and withdraw", async function () {
    const value = ethers.utils.parseEther("1.5");
    await this.signers.user.sendTransaction({
      to: this.contract.address,
      value,
    });

    expect(this.contract.withdraw()).to.changeEtherBalances(
      [this.signers.admin, this.contract],
      [value, value.mul(-1)]
    );
  });

  it("Set base URI", async function () {
    const value = ethers.utils.parseEther("0.1");

    // Mint 2 tokens
    await this.contract.connect(this.signers.user).mint({ value });
    await this.contract.connect(this.signers.user).mint({ value });

    // Check token URI's
    expect(await this.contract.tokenURI(0)).to.be.equal(
      this.baseUri + "0.json"
    );
    expect(await this.contract.tokenURI(1)).to.be.equal(
      this.baseUri + "1.json"
    );

    // Change base URI
    const newBaseUri = "https://new_domain_or_ipfs/";
    await this.contract.setBaseURI(newBaseUri);

    // Check new token URI's
    expect(await this.contract.tokenURI(0)).to.be.equal(newBaseUri + "0.json");
    expect(await this.contract.tokenURI(1)).to.be.equal(newBaseUri + "1.json");
  });

  it("Check token URI", async function () {
    const value = ethers.utils.parseEther("0.1");

    // Mint token by user
    await this.contract.connect(this.signers.user).mint({ value });
    // Check token URI
    expect(await this.contract.tokenURI(0)).to.be.equal(
      this.baseUri + "0.json"
    );

    // Mint token by owner with specified URI
    await this.contract.mintByOwner(this.signers.user.address, "link_to_uri");

    // Check token URI
    expect(await this.contract.tokenURI(1)).to.be.equal(
      this.baseUri + "link_to_uri.json"
    );
  });
});
