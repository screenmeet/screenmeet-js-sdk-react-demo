import React, { Component } from 'react';
import logo from './logo.svg';
import {ScreenMeet} from "@screenmeet/js-sdk";
import './App.css';

class App extends Component {
  
  state = {
    userInfo: null,
    newName: '',
    newType: 'support',
    newFormVisible: false,
    working: false,
    allSessions : [] //used to track/render all user sessions
  }
  
  ScreenMeetMain;
  
  componentDidMount() {
    let sm_global_opts = {
      "mode" : "adhoc",
      "persistAuth" : true,
      "trackSessionState" : true, //will poll for session states for all widgets
      "cbdeployments" : true,
      "eventHandlers":{
        authenticated: (userInfo) => {
          this.setState({'userInfo' : userInfo});
        },
        signout: () => { this.setState({'userInfo' : null})  },
        // destroyed: () => { document.getElementById('adhocsessions').innerHTML = ''; },
        updated: (sessions) => { this.setState({'allSessions' : Object.values(sessions) }) }
      }};
  
    
    //Creates a screenmeet instance which is not bound to any object, can be used to create adhoc sessions
    this.ScreenMeetMain = new ScreenMeet(sm_global_opts);
    
    if (this.ScreenMeetMain.isAuthenticated()) {
      this.ScreenMeetMain.listUserSessions();
    }
    
  }
  
  componentWillUnmount() {
    //cleans a bunch of stuff up
    this.ScreenMeetMain.destroy();
  }
  
  createAdhocSession = async () => {
    this.setState({'working':true})
    try {
      let result = await this.ScreenMeetMain.createAdhocSession(this.state.newType, this.state.newName);
      console.log(`Session created`, result);
    } catch (er) {
      console.error(er);
    }
    
    this.setState({'working':false, 'newFormVisible' : false})
  }
  
  showCreateForm = (sessionKind) => {
    this.setState({'newFormVisible':true});
  }
  
  closeCreateForm = () => {
    this.setState({'newFormVisible':false});
  }
  
  signIn = async () => {
    let cburl = document.location.origin + '/oauth_cb.html';
    let provider = 'sfdc';
    let instance = 'https://login.salesforce.com/'
  
  
    try {
      let result = await this.ScreenMeetMain.signin(provider, cburl,instance);
      console.log('Login result', result);
    } catch (er) {
      console.log('login failed');
      console.error(er);
    }
  }
  
  signOut = async() => {
    try {
      let result = await this.ScreenMeetMain.signout();
      console.log(result);
    } catch (er) {
      console.log('login failed');
      console.error(er);
    }
  }
  
  handleNameChange = (event) => {
    this.setState({'newName' : event.target.value})
  }
  
  handleTypeChange = (event) => {
    this.setState({'newType' : event.target.value})
  }
  
  renderNewSessionForm = () => {
    return <div className='modal'>
      
      <div className='createform'>
        <div className='App-header'>New Session</div>
        <div>
          <label>Session Name</label><br/>
          <input onChange={this.handleNameChange} type='text' value={this.state.newName} />
        </div>
  
        <div>
          <label>Session Type</label><br/>
          <select value={this.state.newType} onChange={this.handleTypeChange}>
            <option value='support'>Support</option>
            <option value='cobrowse'>Cobrowse</option>
            <option value='live'>Live</option>
            <option value='replay'>Replay</option>
          </select>
        </div>
        
        <div className='actionRow'>
          <button disabled={this.state.working} onClick={this.closeCreateForm}>Cancel</button>
          <button disabled={this.state.working} onClick={this.createAdhocSession}>Create</button>
        </div>
      </div>
      
    </div>
  }
  
  render() {
    const {userInfo} = this.state;
    return (
      <div className="App">
        <header className="App-header">
          {userInfo && <div>
            Logged in as <b>{userInfo.user.name} <button onClick={this.signOut}>Sign Out</button></b>
          </div>}
          {!userInfo && <div>
            Not signed into ScreenMeet <button onClick={this.signIn}>Sign In</button>
          </div>}
        </header>
        
        <table style={{'width' : '100%'}}>
          <thead>
          <tr>
          <th width="50%">
            All My Sessions <button onClick={() => { this.showCreateForm('adhoc'); } }>+ New</button>
          </th>
          <th  width="50%">
            CRM Objects Demo
          </th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>
              {this.state.allSessions.map((s) => {
                return <div>{s.label}</div>
              })}
            </td>
            <td></td>
          </tr>
          </tbody>
        </table>
        
        {this.state.newFormVisible && this.renderNewSessionForm()}
      </div>
    );
  }
}

export default App;
