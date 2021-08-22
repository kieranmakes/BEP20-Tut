import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import Web3 from "web3-eth";

function App() {
  const [devToken, setDevToken] = useState(0);
  const [accounts, setAccounts] = useState(0);

  useEffect(() => {
    if (typeof web3 !== "undefined") {
      window.web3 = new Web3(window.web3.currentProvider);
      // check if its metamask installed
      if (window.web3.currentProvider.isMetaMask === true) {
        connectMetaMask();
        connectToSelectedNetwork();
      } else {
        // Another web3 provider, add support for...
      }
    } else {
      throw new Error("No web3 support, redirect user to a download page");
    }
  }, []);

  function connectMetaMask() {
    window.web3
      .requestAccounts()
      .then((result) => {
        setAccounts(result);
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  async function getABI() {
    let ABI = "";
    await fetch("./DevToken.json", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status == 200) {
          return response.json();
        } else {
          throw new Error("Error fetching ABI");
        }
      })
      .then((data) => {
        ABI = data.abi;
      })
      .catch((error) => {
        throw new Error(error);
      });
    return ABI;
  }

  async function getABI() {
    let ABI = "";
    await fetch("./DevToken.json", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }).then((response) => {
      if (response.status == 200) {
        return response.json();
      } else {
        throw new Error();
      }
    });
  }

  function getContractAddress() {
    return "0x3E2952371Ad751d918f3675cbA76F1e59B4523d3";
  }

  async function connectToSelectedNetwork() {
    const web3 = new Web3(Web3.givenProvider);
    const abi = await getABI();
    console.log(abi);
    const address = getContractAddress();

    const devtoken = new web3.Contract(abi, address);
    setDevToken(devToken);
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>Welcome to the Dapp</p>
      </header>
    </div>
  );
}

export default App;
