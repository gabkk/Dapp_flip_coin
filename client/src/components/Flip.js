import React from "react";
import eth_icon from "../images/eth_icon.png";

class Flip extends React.Component{
  state = { sendAmountToBet: "0.1",
            oraclePrice: 0,
            messageStatus: ""};

  validFlip = async (contract, web3, accounts, currentBank, gameStatus, errorFlip, el) => {
      let bankBalance = 0;
      let userBalance = 0;
      let userHistory = 0;
      try {
          userHistory = await contract.methods.getUserHistory(accounts[0]).call();
        } catch (error){
          console.log("fail to get User balance");
        }
        try {
          bankBalance = await contract.methods.getBankBalance(currentBank).call();
        } catch (error){
          console.log("fail to get Bank balance");
        }
        try{
          userBalance = await web3.eth.getBalance(accounts[0]);
          userBalance = web3.utils.fromWei(userBalance) + " ETH"
        } catch(error){
          console.log("fail to get user balance");
        }
        /*
        * Send the result of the new state to the parent component
        */
        this.props.updateFromComponent({loading: false,
                                        userFund: userBalance,
                                        lastFlip: gameStatus,
                                        userHistory: userHistory,
                                        bankFund: bankBalance});
  }

  flip = async () => {
    const { accounts, contract, currentBank, theBankIsOracle, web3 } = this.props;
    if (!isNaN(this.state.sendAmountToBet)){
      var gameStatus = "not play yet";
      if (!theBankIsOracle && parseFloat(this.state.sendAmountToBet) > 5){
        this.setState({errorFlip: true,
                        messageStatus: "You can't bet more than 5 eth with this bank"})
        return;
      } else if (theBankIsOracle && parseFloat(this.state.sendAmountToBet) > 10){
        this.setState({errorFlip: true,
                        messageStatus: "You can't bet more than 10 eth with this bank"})
        return;
      } else{
        this.setState({errorFlip: false});
      }
      /*Modify the message value when a robing is started*/
      let el = document.getElementById("loadingRoberyTitle");
      el.innerHTML = "Robbery in progress";

      var amountInWei = web3.utils.toWei(this.state.sendAmountToBet, "ether");
      try {
        let gas = 100000;
        if(theBankIsOracle){
          gas = 300000;
        }
        this.props.updateFromComponent({loading: true});
        try{
          var responseFlip = await contract.methods.flip(currentBank).send({ from: accounts[0], value: parseInt(amountInWei), gas: gas});
          let validFlip = this.validFlip;
          if (!theBankIsOracle){
            gameStatus = (responseFlip.events.ReturnValue.returnValues[2] ? "win" : "Loose");
            validFlip(contract, web3, accounts, currentBank, gameStatus);
          } else {
            let queryId = responseFlip.events['LogNewProvableQuery'].returnValues._queryId;
            // Change the once for OracleCallback
            await contract.once('OracleCallback', {
              _queryId: queryId,
              fromBlock: 0
            }, function(error, event){
              gameStatus = (event.returnValues._value ? "win" : "Loose");
              validFlip(contract, web3, accounts, currentBank, gameStatus);
              });
          }
          el.innerHTML = "Robbery Done !!";
        } catch(error){
          console.log("flip methods failed");
          this.props.updateFromComponent({loading: false});
          console.log(error);
        }

      } catch (error){
        el.innerHTML = "Robbery Failed";
        this.props.updateFromComponent({loading: false});
        console.log("error When fliping");
        console.log(error);
      } 
    }
  };

  setAmount = e => {
  if (e.target.name === "value"){
      this.setState({ sendAmountToBet: e.target.value });
    }
  };

  render(){
    return(
      <div className="actionRob">
        {this.props.theBankIsOracle &&
        <p className="notLimited">This Bank is using an Oracle (you will pay an extract amount to use it ~0.004 eth) but you are not limited to bet</p>
        }
        <p>Enter the value you want to rob (or loose)</p>
        <div className="enterValue">
          <img className="eth_icon" src={eth_icon} alt="eth_icons" />
          <input type="text" name="value" defaultValue="0.1" onChange={ this.setAmount }/>
          <p className="eth_text">Eth</p>
        </div>
        {this.props.contract &&
          <button type="button" id="robItButton" onClick={this.flip.bind(this)}>Rob It !</button>
        }
        {this.state.errorFlip &&
          <div className="alert alert-danger">
            {this.state.messageStatus}
          </div>
        }
        {!this.props.theBankIsOracle &&
        <p className="limited">This Bank is not using an oracle Max amount 5 eth</p>
        }
      </div>
    );
  }
}

export default Flip;