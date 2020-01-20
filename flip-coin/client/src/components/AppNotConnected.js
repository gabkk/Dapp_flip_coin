import React, { Component } from "react";
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

import BankManagement from "../components/BankManagement";
import Flip from "../components/Flip";

import "../App.css";
import "../stylesheets/application.scss";
import image_gangster from "../images/gangster.jpg";

class AppNotConnected extends Component{
  constructor(props){
    super(props);
    this.state = {
      storageValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      selectedBankFund: 0,
      selectedBankName: 'Default',
      myBankFund: 0,
      userFund: 0,
      userHistory: 0,
      lastFlip: "not play yet",
      myBankName: null,
      listOfBank: null,
      displayWithraw: false,
      isBankOwner: false,
      listOfBankObj: []
    }
  };

	render(){
		return(
      <div className="app">
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Navbar.Brand href="#home">Robe The Bank</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="#comingSoon">swarm version</Nav.Link>
              <Nav.Link href="#info">Info</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link>Balance of your wallet: {this.state.userFund}</Nav.Link>
              <Nav.Link>Account: Not connected</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="bankManagement">
          <BankManagement accounts={this.state.accounts}
                myBankFund={this.state.myBankFund}
                contract={this.state.contract}
                currentBank={this.state.currentBank}
                web3={this.state.web3}
                displayWithraw={this.state.displayWithraw}
                isBankOwner={this.state.isBankOwner}
                myBankName={this.state.myBankName}
                />

        </div>
        <div className="gameContainer">
          {this.state.listOfBankObj ? (
          <div className="bank">
          	<p>This application is using a smart contract, if you want to interact with 
          		it you will have to install metamask
          	</p>
          	<p> Please install metamask and try to refresh your page.
          	</p>
          	<iframe width="853" height="480"
          			title="metamask"
          			src="https://www.youtube.com/embed/ZIGUC9JAAw8&origin=http://localhost"
          			frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          			allowFullScreen></iframe>
          </div>
          ):(
          <div>
          </div>
          )}

          <div className="gameInteraction">
            <p> You have {this.state.lastFlip}</p>
            <div>History: {this.state.userHistory}</div>
            <img src={image_gangster} alt="image_gangster" />
            <Flip accounts={this.state.accounts}
                  contract={this.state.contract}
                  currentBank={this.state.currentBank}
                  web3={this.state.web3}
                   />
          </div>
        </div>
      </div>
    );
	}
};
export default AppNotConnected;