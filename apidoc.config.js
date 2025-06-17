const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

console.log('NODE_ENV', process.env.NODE_ENV);

let metadata = {
  name: 'RFM',
  version: '0.0.1',
  description: 'RFM api documentation',
  title: 'RFM Api',
  sampleUrl: `http://0.0.0.0:${process.env.PORT}/api`
};

function apidoc_setting() {
  if (process.env.NODE_ENV === 'production') {
    console.log('setting production url for apidoc');
    metadata = {
      name: 'RFM',
      version: '0.0.1',
      description: 'RFM api documentation',
      title: 'RFM Api',
      sampleUrl: 'https://rfm-prod.xana.net/api'
    };
    return metadata;
  } else if (process.env.NODE_ENV === 'development') {
    console.log('setting testnet url for apidoc');
    metadata = {
      name: 'RFM',
      version: '0.0.1',
      description: 'RFM api documentation',
      title: 'RFM Api',
      sampleUrl: 'https://rfm-test.xana.net/api'
    };
    return metadata;
  // } else if (process.env.NODE_ENV === 'local') {
  //   console.log('setting testnet url for apidoc');
  //   metadata = {
  //     name: 'RFM',
  //     version: '0.0.1',
  //     description: 'RFM api documentation',
  //     title: 'RFM Api',
  //     sampleUrl: `http://localhost:${process.env.PORT}/api`
  //   };
  //   return metadata;
  } else {
    console.log('setting local url for apidoc');
    // console.log(metadata);
    return metadata;
  }
}

global.apidoc = apidoc_setting();

module.exports = apidoc_setting();
