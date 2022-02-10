"use strict";

let Blockchain = require('./blockchain.js');
let Block = require('./block.js');
let Client = require('./client.js');
let Miner = require('./miner.js');
let Transaction = require('./transaction.js');

let FakeNet = require('./fake-net.js');
const PREProxy = require('./proxy.js');

console.log("Starting simulation.  This may take a moment...");


let fakeNet = new FakeNet();

// Clients
let alice = new Client({name: "Alice", net: fakeNet});
let bob = new Client({name: "Bob", net: fakeNet});
let charlie = new Client({name: "Charlie", net: fakeNet});

// let tom = new Client({name: "Tom", net: fakeNet});

// Miners
let minnie = new Miner({name: "Minnie", net: fakeNet});
let mickey = new Miner({name: "Mickey", net: fakeNet});

// Proxy
let proxy = new PREProxy({name: "Proxy", net: fakeNet});

// Creating genesis block
let genesis = Blockchain.makeGenesis({
  blockClass: Block,
  transactionClass: Transaction,
  clientBalanceMap: new Map([
    [alice, 233],
    [bob, 99],
    [charlie, 67],
    [minnie, 400],
    [mickey, 300],
    [proxy, 50]
  ]),
});

// Late miner - Donald has more mining power, represented by the miningRounds.
// (Mickey and Minnie have the default of 2000 rounds).
let donald = new Miner({name: "Donald", net: fakeNet, startingBlock: genesis, miningRounds: 3000});

function showBalances(client) {
  console.log(`Alice has ${client.lastBlock.balanceOf(alice.address)} gold.`);
  console.log(`Bob has ${client.lastBlock.balanceOf(bob.address)} gold.`);
  console.log(`Charlie has ${client.lastBlock.balanceOf(charlie.address)} gold.`);
  console.log(`Minnie has ${client.lastBlock.balanceOf(minnie.address)} gold.`);
  console.log(`Mickey has ${client.lastBlock.balanceOf(mickey.address)} gold.`);
  console.log(`Donald has ${client.lastBlock.balanceOf(donald.address)} gold.`);
  console.log(`Proxy has ${client.lastBlock.balanceOf(proxy.address)} gold.`);
}

// function showSecretData(client) {
  // console.log(client.lastBlock);
  // console.log(`Alice has ${client.lastBlock.secretOf(alice.address)} .`);
  // console.log(`Bob has ${client.lastBlock.secretOf(bob.address)} .`);
  // console.log(`Charlie has ${client.lastBlock.secretOf(charlie.address)} .`);
  // console.log(`Minnie has ${client.lastBlock.secretOf(minnie.address)} .`);
  // console.log(`Mickey has ${client.lastBlock.secretOf(mickey.address)} .`);
  // console.log(`Donald has ${client.lastBlock.secretOf(donald.address)} .`);
  // console.log(`Proxy has ${client.lastBlock.secretOf(proxy.address)} .`);
// }

// Showing the initial balances from Alice's perspective, for no particular reason.
console.log("Initial balances:");
showBalances(alice);

fakeNet.register(alice, bob, charlie, minnie, mickey, proxy);

// Miners start mining.
minnie.initialize();
mickey.initialize();

// Alice transfers some money to Bob.
// alice.postTransaction([{ amount: 40, address: bob.address }]);
// console.log(`Alice is transferring 40 gold to ${bob.address}`);

//Alice post her content along with its price to the blockchain
// the second parameter is upload its content value to its client itself
// It also encrypted the data and store it in the proxy
alice.postPriceTransaction({dataName: "GPA", description: "This is my GPA at SJSU ", price: 33.0}, "2.7");


// Charlie post his content along with its price to the blockchain
charlie.postPriceTransaction({dataName: "BR", description : "My recent blood test result", price: 180.0}, "Negative");

setTimeout(() => {
  console.log();
  console.log("***Starting a late-to-the-party miner***");
  console.log();

  console.log(bob.lastBlock);
  let obj = bob.lastBlock.secretOf(alice.address);

  // both buyer and data owner generate the key pair for the specific data
  alice.generateReEncryptionKeyPair(obj.dataName);
  bob.generateReEncryptionKeyPair(obj.dataName);

  // Bob buys Alice's content for the listed price
  bob.postTransaction([{ amount: obj.price, address: alice.address }]);

  // Alice upload the data content to the proxy
  alice.postEncryptDataTransaction(obj.dataName, proxy);

  //Alice receives the money and then Bob sends generate the encryption key-pair,
  // and send his public key to Alice
  bob.postPublicKeyTransaction(obj.dataName, alice);

  alice.postReEncryptionKeyTransaction(obj.dataName, proxy);

  proxy.postReEncryptedDataTransaction(obj.dataName, bob);

  let result = bob.decrypt(obj.dataName);
  console.log("Bob's decrypt result is: " + result);

  fakeNet.register(donald);
  donald.initialize();
}, 2000);

// Print out the final balances after it has been running for some time.
setTimeout(() => {
  console.log();
  console.log(`Minnie has a chain of length ${minnie.currentBlock.chainLength}:`);

  console.log();
  console.log(`Mickey has a chain of length ${mickey.currentBlock.chainLength}:`);

  console.log();
  console.log(`Donald has a chain of length ${donald.currentBlock.chainLength}:`);

  console.log();
  console.log("Final balances (Minnie's perspective):");
  showBalances(minnie);

  console.log();
  console.log("Final balances (Alice's perspective):");
  showBalances(alice);

  console.log();
  console.log("Final balances (Donald's perspective):");
  showBalances(donald);

  // console.log(alice.lastBlock);

  // showSecretData(alice);
  // let obj = charlie.lastBlock.secretOf(alice.address);
  // console.log(JSON.parse(obj.data1));
  // console.log(charlie.lastBlock.secretOf(alice.address));

  process.exit(0);

}, 5000);