pragma solidity ^0.5.0;
import '../client/node_modules/@openzeppelin/contracts/math/SafeMath.sol';
import '../client/node_modules/@openzeppelin/contracts/drafts/SignedSafeMath.sol';

// Import SafeMath library from github (this import only works on Remix).
//import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract RobTheBank{

	using SafeMath for uint256;
	using SignedSafeMath for int256;

    struct Bank {
        string name;
        uint256 balance;
        bool isCreated;
    }

	mapping (address => int256) public userHistory;
	mapping(address => Bank) public Banks;
	address public owner;
	address[] public listOfBank;

	event ReturnValue(bool _value);
    event LogListOfBank(string name, address addr, uint256 balance);

	constructor() public payable{
		owner = msg.sender;

		// Contract address
		require(msg.value >= 0.1 ether);
		Banks[msg.sender].balance = msg.value;
		Banks[msg.sender].name = "FED";
		Banks[msg.sender].isCreated = true;
		listOfBank.push(msg.sender);
		emit LogListOfBank("FED", msg.sender, msg.value);
	}


	/* Move Modifier to an other file*/
	modifier onlyOwner{
		require(owner == msg.sender);
		_;
	}

	modifier messValueCantBeZero{
		require(msg.value > 0 ether, "msg.value can't 0");
		_;
	}

	modifier msgValueMin{
		require(msg.value >= 0.1 ether, "bet can't be less than 0,1");
		_;
	}

	modifier isBankCreated{
		require(Banks[msg.sender].isCreated == true, "Bank doesn't exist");
		_;
	}

	// add name to the bank Struct
	function createBank(string memory _name) public payable{
		require(Banks[msg.sender].isCreated == false, "You can only own one bank");
		require(bytes(_name).length < 21);
		require(bytes(_name).length > 0);
		require(msg.value >= 0.1 ether);
		Banks[msg.sender].balance = msg.value;
		Banks[msg.sender].isCreated = true;
		Banks[msg.sender].name = _name;
		listOfBank.push(msg.sender);
		emit LogListOfBank(_name, msg.sender, msg.value);
	}

	function getBankLength() view public returns(uint256){
		return listOfBank.length;
	}

	function getListOfBank() view public returns(address[] memory){
		return listOfBank;
	}

	/* Todo test view */
	function getListOfBankObj() public {
		for(uint i=0; i < listOfBank.length; i++){
			emit LogListOfBank(getBankName(listOfBank[i]), listOfBank[i], getBankBalance(listOfBank[i]));
		}
	}

	function getBankBalance(address _bankAddr) view public returns(uint256){
		return Banks[_bankAddr].balance;
	}

	function getBankName(address _bankAddr) view public returns(string memory){
		return Banks[_bankAddr].name;
	}

	function getBankInfos(address _bankAddr) view public returns(string memory, uint256, bool){
		Bank memory p = Banks[_bankAddr];
		return (p.name, p.balance, p.isCreated);
	}

	// Get the balance of the user
	function getUserHistory(address player) view public returns(int256){
		return userHistory[player];
	}

	/*
	* As the timestamp can be control by the miner we need to set
	* a max limit per bet in the flip function.
	*/
	function pseudoRandom() private view returns (uint8) {
		uint256 firstRes = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
		uint8 result = uint8(firstRes.mod(251));
		return result;
	}

	/*	Error Cases
	*
	*	error -1 Bet can't be more than 10
	*	error -2 user bet could't be null
	*	error -3 Contract address don't have enought found to pay the user
	*	error -4 The value is too big regarding to the previous contract rules
	*			 and it will make fail the implicit cast for the player historic
	*
	*/

	function flip(address _bankAddr) public payable msgValueMin returns (bool){
		// To avoid the Martingale we need a limit
		require(msg.value < 10 ether, "bet should be less than 10 eth");
		require(Banks[_bankAddr].balance >= msg.value, "bank balance should be greater than the jackpot");

		// Run the pseudorandom function
		uint8 randomResult = pseudoRandom();

		if(randomResult % 2 == 0){
			Banks[_bankAddr].balance = Banks[_bankAddr].balance.sub(msg.value);
			msg.sender.transfer(msg.value.mul(2));
			// Not really safe to cast but the value is high enought to be a problem
			userHistory[msg.sender] = userHistory[msg.sender].add(int256(msg.value));
			emit ReturnValue(true);
			return true;
		} else {
			Banks[_bankAddr].balance = Banks[_bankAddr].balance.add(msg.value);
			// Not really safe to cast but the value is high enought to be a problem
			userHistory[msg.sender] = userHistory[msg.sender].sub(int256(msg.value));
		}
		emit ReturnValue(false);
		return false;
	}

	function sendMoneyToTheBank() public payable messValueCantBeZero {
		require(Banks[msg.sender].isCreated == true, "You don't have a bank yet");
		Banks[msg.sender].balance = Banks[msg.sender].balance.add(msg.value);
	}

	function isBankOwner(address _myCall) public view returns (bool){
		if (Banks[_myCall].isCreated == true)
			return true;
		return false;
	}

	function withdrawBankAccount() public payable isBankCreated{
		require(Banks[msg.sender].balance != 0);
		uint value = Banks[msg.sender].balance;
		Banks[msg.sender].balance = 0;
		msg.sender.transfer(value);
	}

	function destroyContract() public onlyOwner{
		selfdestruct(msg.sender);
	}
}