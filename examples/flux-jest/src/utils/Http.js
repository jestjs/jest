import Promise from 'bluebird';
import friendsJson from '../components/fixture/friends';

var Http = {

  get(url) {
    // we don't want to make an actual request,
    // so we just return the fixture
    return new Promise((resolve, reject) => {
      resolve(friendsJson);
    });
  }

}

export default Http;
