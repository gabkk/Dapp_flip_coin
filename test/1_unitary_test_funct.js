const RobTheBank = artifacts.require("RobTheBank");
const truffleAssert = require('truffle-assertions');

contract("RobTheBankSimple", async function(accounts){

  const bank_value = web3.utils.toWei("0.1", 'ether');
  const bank_value2 = web3.utils.toWei("0.2", 'ether');
  const wallet1 = accounts[0];
  const wallet2 = accounts[1];
  const wallet_unset = accounts[7];
  const bank_default_name = "FED";
  const bank_default_is_create = true;
  const revert_error = "Returned error: VM Exception while processing transaction: revert";
  
  beforeEach('Setup contract for each test', async() => {
    RobTheBankInstance = await RobTheBank.new({from: wallet1, value: bank_value});
    //console.log(RobTheBankInstance);
  })

  afterEach('Destroy the contract to get back the fund used in the test', async() => {
  	await truffleAssert.passes(RobTheBankInstance.destroyContract({from: wallet1}),
  							   "Failed to destroy the contract");
  });
  /*
  *  Test initial value from constructor
  */

  it("...[constructor] The constract should be initiat with a value > 0.1", async () => {
    await truffleAssert.reverts(RobTheBank.new({from: wallet1, value: 0}),
    							revert_error);
  });

  it("...[constructor] The owner of the constract should be account[0]", async () => {
    const owner = await RobTheBankInstance.owner();
    assert.equal(owner, wallet1, "The contract owner is not the first account.");
  });

  it("...[constructor] The first bank own by account[0] should have the default param", async () => {    
    const bankDefault = await RobTheBankInstance.getBankInfos.call(wallet1);
    assert.equal(bankDefault[0], bank_default_name, "The name of the default bank was not stored.");
    assert.equal(bankDefault[1], bank_value, "The balance of the default bank was not stored.");
    assert.equal(bankDefault[2], true, "The status is_created should be set to true.");
    assert.equal(bankDefault[3], true, "The status is_oracle should be set to true.");    
  });

  it("...[constructor] The first bank should be push into the listOfBank", async () => {
    let firstBank = 0;
    try {
	    firstBank = await RobTheBankInstance.listOfBank.call(0);
    } catch (error){
    	console.log(error);
    	throw null;
    }
    assert.equal(firstBank, wallet1, "The first account should possess the first bank.");
  });

  it("...[constructor] The contract should emit a LogListOfBank event", async () => {
	let result = await truffleAssert.createTransactionResult(RobTheBankInstance, RobTheBankInstance.transactionHash);
	truffleAssert.eventEmitted(result, 'LogListOfBank', (ev) => {
	    return ev.name === "FED" && ev.addr === accounts[0] && ev.balance.toString() === bank_value;
	}, 'LogListOfBank should be emitted with correct parameters');
  });

  /*
  *  Simple tests for create Bank
  */
  it("...[simple createBank] The bank creation should failed if no name is provided", async() => {
  	await truffleAssert.reverts(RobTheBankInstance.createBank("", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}),
    														revert_error);
  });

  it("...[simple createBank] The bank creation should failed if the name is greater than 20 char", async() => {
  	await truffleAssert.reverts(RobTheBankInstance.createBank("012345678901234567890", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}),
    														revert_error);
  });

  it("...[simple createBank] You shouldn't be able to create two bank with the same account", async() => {
  	await truffleAssert.reverts(RobTheBankInstance.createBank("FED2", false ,
  															{ from: wallet1,
  															  value: bank_value
  															}),
    														revert_error);
  });

  it("...[simple createBank] You shouldn't be able to create two bank with the same account", async() => {
  	await truffleAssert.reverts(RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: web3.utils.toWei("0.09", 'ether')
  															}),
    														revert_error);
  });

  it("...[simple createBank] You should be able to create a second bank", async() => {
  	let result = await RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															});
    const secondBank = await RobTheBankInstance.getBankInfos.call(wallet2);
    assert.equal(secondBank[0], "secondBank", "The name of the default bank was not stored.");
    assert.equal(secondBank[1], bank_value2, "The balance of the default bank was not stored.");
    assert.equal(secondBank[2], true, "The status is_created should be set to true.");
    assert.equal(secondBank[3], false, "The status is_oracle shouldn't be set to true."); 

    let secondBankFromList = 0;
    try {
	    secondBankFromList = await RobTheBankInstance.listOfBank.call(1);
    } catch (error){
    	console.log(error);
    	throw null;
    }
    assert.equal(secondBankFromList, wallet2, "The second account should possess the second bank.");
  
  	/* Get the result to catch event */
	truffleAssert.eventEmitted(result, 'LogListOfBank', (ev) => {
	    return ev.name === "secondBank" && ev.addr === wallet2 && ev.balance.toString() === bank_value2;
	}, 'LogListOfBank should be emitted with correct parameters');
  });  

  /*
  *  Simple tests of getter
  */

  /* getBankLength */

  it("...[simple getBankLength] Should be initiat at one", async () => {
    const len = await RobTheBankInstance.getBankLength();
    assert.equal(len, 1, "The contract should have one bank in his list.");
  });

  it("...[simple getBankLength] Should increase to two the bank array when creating a new bank", async () => {
  	await truffleAssert.passes(RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}));
    const len = await RobTheBankInstance.getBankLength();
    assert.equal(len, 2, "The contract should have a second bank in his list, after a createBank");
  });

  /* getListOfBank */

  it("...[simple getListOfBank] Should set the initial list of bank with the default bank", async () => {
    const banksArray = await RobTheBankInstance.getListOfBank();
    assert.equal(banksArray[0], wallet1, "The first bank is not owned by the first account.");
  });

  it("...[simple getListOfBank] Should set the list of Banks with two bank", async () => {
  	await truffleAssert.passes(RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}));
    const banksArray = await RobTheBankInstance.getListOfBank();
    assert.equal(banksArray[0], wallet1, "The contract is not set with the first account.");
    assert.equal(banksArray[1], wallet2, "The contract is not set with the second account.");
  });

  /* getListOfBankObj */

  it("...[simple getListOfBankObj] Should emit one event LogListOfBank", async () => {
  	/* Get the result to catch event */
    let result = await RobTheBankInstance.getListOfBankObj();

	truffleAssert.eventEmitted(result, 'LogListOfBank', (ev) => {
	    return ev.name === "FED" && ev.addr === accounts[0] && ev.balance.toString() === bank_value;
	}, 'LogListOfBank should be emitted with correct parameters');
  });

  it("...[simple getListOfBankObj] Should emit one event LogListOfBank", async () => {

  	/* Add the seconde bank*/
  	await truffleAssert.passes(RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}));
  	/* Get the result to catch event */
    let result = await RobTheBankInstance.getListOfBankObj();

  	/* Check how many events are emitted*/
  	truffleAssert.eventEmitted(result, 'LogListOfBank', (ev) => {
	    return ev.name === "FED" && ev.addr === accounts[0] && ev.balance.toString() === bank_value;
	}, 'LogListOfBank should be emitted with correct parameters');

	truffleAssert.eventEmitted(result, 'LogListOfBank', (ev) => {
	    return ev.name === "secondBank" && ev.addr === accounts[1] && ev.balance.toString() === bank_value2;
	}, 'LogListOfBank should be emitted with correct parameters');
  });

  /* getBankBalance */

  it("...[simple getBankBalance] Should get a balance equal to zero for an unset bank", async () => {
    const value = await RobTheBankInstance.getBankBalance.call(wallet_unset);
    assert.equal(value, 0, "The Balance of an unset bank should be empty.");
  });

  it("...[simple getBankBalance] Should get the initial bank deposit with the value of 'bank_value'", async () => {
    const value = await RobTheBankInstance.getBankBalance.call(wallet1);
    assert.equal(value, bank_value, "The value 'bank_value' was not stored.");
  });

  it("...[simple getBankBalance] Should get the balance of the new bank created", async () => {
      	/* Add the seconde bank*/
  	await truffleAssert.passes(RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}));
    const value = await RobTheBankInstance.getBankBalance.call(wallet2);
    assert.equal(value, bank_value2, "The value of the new bank was not stored.");
  });

  /* getBankName */

  it("...[simple getBankName] Should get an empty name for an unset bank", async () => {
    const value = await RobTheBankInstance.getBankName.call(wallet_unset);
    assert.equal(value, "", "The name of an unset bank should be empty.");
  });

  it("...[simple getBankName] Should get the name of the default bank", async () => {
    const value = await RobTheBankInstance.getBankName.call(wallet1);
    assert.equal(value, bank_default_name, "The name of the default bank was not stored.");
  });

  it("...[simple getBankName] Should get the name of the new bank created", async () => {
      	/* Add the seconde bank*/
  	await truffleAssert.passes(RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}));
    const value = await RobTheBankInstance.getBankName.call(wallet2);
    assert.equal(value, "secondBank", "The name of the new bank was not stored.");
  });


  /* getBankInfos */

  it("...[simple getBankInfos] Should get empty element from the bank structure", async () => {
    const value = await RobTheBankInstance.getBankInfos.call(wallet_unset);
    assert.equal(value[0], '', "The name of an unset bank should be empty.");
    assert.equal(value[1], 0, "The name of an unset bank should be empty.");
    assert.equal(value[2], false, "The name of an unset bank should be empty.");
  });

  it("...[simple getBankInfos] Should get all the elements from the default bank structure", async () => {
    const value = await RobTheBankInstance.getBankInfos.call(wallet1);
    assert.equal(value[0], bank_default_name, "The name of the default bank was not stored.");
    assert.equal(value[1], bank_value, "The balance of the default bank was not stored.");
    assert.equal(value[2], true, "The status is created shouldn't be empty.");
  });

  it("...[simple getBankInfos] Should get all the elements from the bank structure created", async () => {
      	/* Add the seconde bank*/
  	await truffleAssert.passes(RobTheBankInstance.createBank("secondBank", false ,
  															{ from: wallet2,
  															  value: bank_value2
  															}));
    const value = await RobTheBankInstance.getBankInfos.call(wallet2);
    assert.equal(value[0], "secondBank", "The name of the default bank was not stored.");
    assert.equal(value[1], bank_value2, "The balance of the default bank was not stored.");
    assert.equal(value[2], true, "The status is created shouldn't be empty.");
  });


  /* getUserHistory */

  it("...[simple getUserHistory] User historic should be 0", async () => {
    const value = await RobTheBankInstance.getUserHistory.call(wallet1);
    assert.equal(value, 0, "The value of user history is not 0");
  });


  /* isBankOwner */

  it("...[simple isBankOwner] Should pass if the bank have been created", async () => {
    await truffleAssert.passes(RobTheBankInstance.isBankOwner.call(wallet1));
  });

  it("...[simple isBankOwner] Should fail if the bank have not been created", async () => {
    await truffleAssert.passes(RobTheBankInstance.isBankOwner.call(wallet_unset));
  });

  it("...[simple isBankOwner] wallet 1 should be a bank owner", async () => {
    const value = await RobTheBankInstance.isBankOwner.call(wallet1);
    assert.equal(value, true, "The value of user history is not 0");
  });


  it("...[simple isBankOwner] wallet 1 should be a bank owner", async () => {
    const value = await RobTheBankInstance.isBankOwner.call(wallet1);
    assert.equal(value, true, "The value of user history is not 0");
  });

  it("...[simple isBankOwner] wallet 2 shouldn't be a bank owner", async () => {
    const value = await RobTheBankInstance.isBankOwner.call(wallet2);
    assert.equal(value, false, "The value of user history is not 0");
  });

});
