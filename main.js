const ethers = require('ethers');
const Kredits = require('kredits-contracts');

var ABI = [{"constant":true,"inputs":[],"name":"ens","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"fac","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"appId","type":"bytes32"}],"name":"latestVersionAppBase","outputs":[{"name":"base","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"appIds","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_fac","type":"address"},{"name":"_ens","type":"address"},{"name":"_appIds","type":"bytes32[4]"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"dao","type":"address"}],"name":"DeployInstance","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"dao","type":"address"},{"indexed":false,"name":"appProxy","type":"address"},{"indexed":false,"name":"appId","type":"bytes32"}],"name":"InstalledApp","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"appProxy","type":"address"},{"indexed":false,"name":"appId","type":"bytes32"}],"name":"InstalledApp","type":"event"},{"constant":false,"inputs":[],"name":"newInstance","outputs":[{"name":"dao","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"}];

var ipfsConfig = { host: 'ipfs.infura.io', port: '5001', protocol: 'https' }
var address = "0x76e069b47b79442657eaf0555a32c6b16fa1b8b4";
var apmDomain = "open.aragonpm.eth";

var searchParams = new URLSearchParams(document.location.search);
if (searchParams.get('local') || document.location.host.match(/localhost/)) {
  console.log('Using local settings');
  ipfsConfig = { host: 'localhost', port: '5001', protocol: 'http' };
  address = searchParams.get('kit');
  apmDomain = null;
}

document.getElementById('add-contributor-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!window.kredits) {
    alert('Please create a new organization first');
    return;
  }
  const contributorAttr = {
    account: document.getElementById('account').value,
    name: document.getElementById('name').value,
    url: document.getElementById('url').value,
    kind: 'person'
  };
  var github_username = document.getElementById('github_username').value;
  if (github_username !== '') {
    contributorAttr.github_username = github_username;
  }
  var github_uid = document.getElementById('github_uid').value;
  if (github_uid !== '') {
    contributorAttr.github_uid = parseInt(github_uid);
  }

  kredits.Contributor.add(contributorAttr)
    .then(tx => {
      notice.innerHTML = `Done, all set.<br />Add more contributors if you want.`;
      tx.wait(1).then(() => {
        window.kredits.Contributor.all()
          .then(contributors => {
            console.log(contributors);
          });
      });
    })
    .catch(e => {
      console.log(e);
      alert('Sorry, something went wrong');
    })
});

if (window.ethereum) {
  window.ethereum.enable()
    .then(function() {
      var notice = document.getElementById('notice');
      window.ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      window.signer = ethProvider.getSigner();
      window.kreditsKit = new ethers.Contract(address, ABI, signer);

      window.signer.getAddress().then(address => {
        document.getElementById('account').value = address;
      });

      document.getElementById('start').addEventListener('click', () => {
        kreditsKit.newInstance().then(transaction => {
          document.getElementById('rinkeby-notice').style.display = "none";
          console.log('transaction', transaction);
          notice.innerHTML = `Transaction pushlished ${transaction.hash}. Waiting for transaction to be mined... Please wait, this can take a moment.`;
          transaction.wait(1).then(result => {
            var deployEvent = result.events.find(e => e.event === 'DeployInstance');
            window.daoAddress = deployEvent.args.dao;

            new Kredits(window.ethProvider, window.signer, { ipfsConfig: ipfsConfig, apm: apmDomain, addresses: { Kernel: window.daoAddress }}).init()
              .then(kredits => {
                window.kredits = kredits;
                document.getElementById('org-notice').innerHTML = `<p>Your Kredits organization address is: ${daoAddress}.<br />The Coin address is: ${kredits.Token.contract.address}.</p>`;
                notice.innerHTML = "Organization created, now add yourself as first contributor.";
                document.getElementById('add-contributor-form').style.display = 'block';
              });
          }).catch(console.log);
        })
      });
    })
    .catch(e => {
      console.log(e);
      alert('Ethereum access is required');
    });
} else {

}
