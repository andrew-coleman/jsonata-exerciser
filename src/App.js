import React, { Component } from 'react';
import logo from './images/JSONata-white-38.png';
import share from './images/share.svg';
import docs from './images/docs-white-32.png';
import twitter from './images/twitter-white.png';
import slack from './images/Slack_Mark_Monochrome_White.svg';
import stackoverflow from './images/so-white-32.png';
import github from './images/GitHub-Mark-Light-32px.png';
import './exerciser.css';
import { BrowserRouter, Route } from 'react-router-dom';
import Exerciser3 from './Exerciser3';

class App extends Component {

    loadData({match}){
        console.log(match);
        return <Exerciser3 data={match ? match.params.id : null}/>;
    }

  render() {
    return (
      <BrowserRouter>
          <div className="App">
            <header className="App-header">
                <div id="banner">
                    <div id="logo"><a href="http://jsonata.org"><img src={logo}/></a></div>
                    <div id="banner1" className="bannerpart">JSONata Exerciser</div>
                    <div id="banner2" className="bannerpart">&nbsp;</div>
                    <div id="banner3" className="bannerpart">&nbsp;</div>
                    <div id="banner4" className="bannerpart">
                        <a href="#share"><img src={share} alt="Save and Share"/></a>
                        <a href="http://docs.jsonata.org"><img src={docs} alt="Documentation"/></a>
                        <a
                          href="http://twitter.com/intent/tweet?status=JSONata:  The JSON query and transformation language.+http://jsonata.org"><img
                          id="t-icon" src={twitter}/></a>
                        <a href="#slack"><img src={slack} alt="Join us on Slack"/></a>
                        <a href="http://stackoverflow.com/search?q=JSONata"><img src={stackoverflow}/></a>
                        <a href="https://github.com/jsonata-js/jsonata"><img
                          src={github}/></a>
                    </div>
                </div>
            </header>
            <main>
              <Route path="/:id" children={this.loadData}/>
            </main>
          </div>
      </BrowserRouter>
    );
  }
}

export default App;
