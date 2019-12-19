import React, { Component } from "react";
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

class BankManagement extends Component{
    constructor(props){
        super(props);
        this.state = {
            displayWithraw: false,
            isBankOwner: false,
            sendFund: null,
            sendFundToNewBank: null,
            nameToCreateBank: null,
            myBankFund: this.props.myBankFund,
            myBankName: this.props.myBankName
        }
    };
  componentDidMount = async () => {
    console.log("Bank management info :");
    console.log(this.props);
    console.log("DId mount i m bank owner")
    // Loop To catch user wallet changes
    this.timer = this.launchTimer();
  };

  // stopTimer = () => {
  //   console.log("stoooop");
  //   clearInterval(this.timer);
  // };

  launchTimer= () => {
    this.timer = setInterval(async () => {
        try{
          let myBankObj = await this.props.contract.methods.getBankInfos(this.props.accounts[0]).call();
          //console.log("Inside UPDATE INTERFACE");
          //console.log(myBankObj);
          this.setState({ myBankName: myBankObj[0],
                          myBankFund: myBankObj[1],
                          isBankOwner: myBankObj[2]});
        } catch(error){
          console.log("failed to getBankInfos of accounts[0] : " + error);
        }
      }, 1000);
  }

  updateBalances = async (currentBank, account, web3, contract) => {
    let userFund = 0;
    let bankFund = 0;
    try {
      bankFund = await contract.methods.getBankBalance(currentBank).call();
    } catch (error){
      console.log("BankManagement fail to get Bank balance: " + error);
    }
    try {
      userFund = await web3.eth.getBalance(account);
      userFund = web3.utils.fromWei(userFund) + " ETH";
    } catch (error){
      console.log("BankManagement fail to get User balance" + error);
    }
  	return {userFund: userFund, bankFund: bankFund}
  };

  sendMoney = async () => {
	const { accounts, contract, currentBank, web3 } = this.props;
    let ret;
    try{
      await contract.methods.sendMoneyToTheBank().send({from: accounts[0], value: parseInt(this.state.sendFund)});
    } catch(error){
      console.log("BankManagement sendMoney: send money to bank failed" + error);
    }
    /* The user is only able to send money to his own bank */
    try{
      ret = await this.updateBalances.bind(this, accounts[0], accounts[0], web3, contract)();
    } catch (error){
      console.log("updateBalances failed:" + error);
    }
    if (this.props.currentBank === accounts[0]){
        this.props.updateFromComponent({displayWithraw: true,
                                        userFund: ret.userFund,
                                        myBankFund: ret.bankFund,
                                        selectedBankFund: ret.bankFund});
    } else {
        this.props.updateFromComponent({displayWithraw: true,
                                        userFund: ret.userFund,
                                        myBankFund: ret.bankFund});
    }
  };

  withdraw = async () => {
    const { accounts, contract, currentBank, web3 } = this.props;
    let ret;
    try{
      await contract.methods.withdrawBankAccount().send({from: accounts[0]});
    } catch(error){
      console.log("BankManagement Failed to witdhraw from bank account" + error);
    }
    try{
      ret = await this.updateBalances.bind(this, currentBank, accounts[0], web3, contract)();
    } catch (error){
      console.log("updateBalances failed:" + error);
    }
    this.props.updateFromComponent({displayWithraw: false, userFund: ret.userFund, myBankFund: 0});
  };

  createNewBank = async(value) => {
    const { accounts, contract } = this.props;
    let listOfBank;
    let bankFund;
    try{
      await contract.methods.createBank(this.state.nameToCreateBank).send({from: accounts[0], value: parseInt(this.state.sendFundToNewBank)});
    } catch(error){
      console.log("BankManagement Failed to create new bank account" + error);
    }
    try {
      bankFund = await contract.methods.getBankBalance(this.state.currentBank).call();
    } catch (error){
      console.log("BankManagement createNewBank fail to get Bank balance");
    }
    try {
      listOfBank = await contract.methods.getListOfBank().call();
    } catch (error){
      console.log("BankManagement createNewBank list of bank empty");
    }
    this.props.updateFromComponent({displayWithraw: true,
                                    listOfBank: listOfBank,
                                    bankFund: bankFund,
                                    myBankName: this.state.nameToCreateBank,
                                    myBankFund: this.state.sendFundToNewBank,
                                    isBankOwner: true});
  }

  setAmount = e => {
    if (e.target.name === "valueToSendToBank"){
      this.setState({ sendFund: e.target.value });
      console.log("value to bank" + e.target.value);
    } else if (e.target.name === "valueToCreateBank"){
      this.setState({ sendFundToNewBank: e.target.value });
    }
    if (e.target.name === "nameToCreateBank"){
      this.setState({ nameToCreateBank: e.target.value });
    }
  };

  render(){
    return(
      <div>
        <p>Bank {this.state.myBankName}</p>
        <p> funds {this.state.myBankFund}</p>
        {this.props.isBankOwner ? (
          <div>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="0"
              aria-label="0"
              aria-describedby="basic-addon2"
              type="text"
              name="valueToSendToBank"
              onChange={ this.setAmount }
            />
            <InputGroup.Append>
              <Button type="button" variant="outline-secondary" onClick={this.sendMoney.bind(this)}>
                Send money to the bank
              </Button>
            </InputGroup.Append>
          </InputGroup>
          </div>
          ) : (
          <div>
            <InputGroup className="mb-3">
            <FormControl
              placeholder="default"
              aria-label="default"
              aria-describedby="basic-addon2"
              type="text"
              name="nameToCreateBank"
              onChange={ this.setAmount }
            />
            <FormControl
              placeholder="0"
              aria-label="0"
              aria-describedby="basic-addon2"
              type="text"
              name="valueToCreateBank"
              onChange={ this.setAmount }
            />
            <InputGroup.Append>
              <Button type="button" onClick={this.createNewBank.bind(this)} variant="outline-secondary">
                create new bank
              </Button>
            </InputGroup.Append>
            </InputGroup>
          </div>
          )
        }
        {this.props.displayWithraw &&
          <Button type="button" onClick={this.withdraw.bind(this)} variant="success">Withraw</Button>
        }
      </div>
    )};
};

export default BankManagement;