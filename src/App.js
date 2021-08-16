import React, { Component } from 'react';
import logo from './logo.svg';
import {ScreenMeet} from "@screenmeet/js-sdk";
import SupportSession from "./components/SupportSession";
import CRMCase from "./components/CRMCase";
import _ from 'lodash';
import './App.css';

class App extends Component {
  
  state = {
    userInfo: null,
    newName: '',
    newType: 'support',
    newFormVisible: false,
    working: false,
    allSessions : [], //used to track/render all user sessions
    crmObjects: [],
    prefOptions: [],
    selectedOpts : {}
  }
  
  ScreenMeetMain;
  
  createCrmObject = () => {
    let newObj = {
      'type' : 'case',
      'id' : this.uuidv4(),
      'name' : 'Case ' + (Math.round(Math.random() * 900000)+100000).toString()
    }
    
    let objects = [...this.state.crmObjects, newObj];
    this.updateCrmObject(objects);
  }
  
  updateCrmObject = (o) => {
    this.setState({'crmObjects': o});
    localStorage.setItem('sm_demo_crm_bojects', JSON.stringify(o));
  }
  
  
  componentDidMount() {
    let sm_global_opts = {
      "mode": "adhoc",
      "persistAuth": true,
      "trackSessionState": true, //will poll for session states for all widgets
      "cbdeployments": true,
      "api_endpoint" : "https://ea-home-dev.screenmeet.com:3002/v3"
    };
    //Creates a screenmeet instance which is not bound to any object, can be used to create adhoc sessions
    this.ScreenMeetMain = new ScreenMeet(sm_global_opts);
    this.ScreenMeetMain.on("signout", () => { this.setState({'userInfo' : null})  });
    this.ScreenMeetMain.on("updated", (sessions) => { this.setState({'allSessions' : Object.values(sessions) });} );
    
    //if we already are authenticated, render the info and fetch sessions
    if (this.ScreenMeetMain.isAuthenticated()) {
      this.onAuthenticated(this.ScreenMeetMain.global.me);
    }
    //if we aren't authenticated, but might become later
    this.ScreenMeetMain.on("authenticated", this.onAuthenticated);
    
    //restore crm objects from localStorage
    let crmObjects = localStorage.getItem('sm_demo_crm_bojects');
    if (crmObjects) {
      try{
        let objects = JSON.parse(crmObjects);
        this.setState({'crmObjects': objects});
      } catch (e) {}
    }
  }
  
  onAuthenticated = (userInfo) => {
    console.log('authenticated as ', userInfo);
    this.setState({'userInfo' : userInfo});
    this.ScreenMeetMain.listUserSessions();
  }
  
  componentWillUnmount() {
    //cleans a bunch of stuff up
    this.ScreenMeetMain.destroy();
  }
  
  createAdhocSession = async () => {
    this.setState({'working':true})
    try {
      let prefs = this.state.selectedOpts;
      let result = await this.ScreenMeetMain.createAdhocSession(this.state.newType, this.state.newName, prefs);
      console.log(`Session created`, result);
      this.ScreenMeetMain.listUserSessions(); //refreshes the list of sessions
    } catch (er) {
      console.error(er);
    }
    
    this.setState({'working':false, 'newFormVisible' : false})
  }

  showCreateForm = () => {
    let prefOpts = this.ScreenMeetMain.getSessionPrefOptions(this.state.newType);
    this.setState({'newFormVisible':true, prefOptions: prefOpts});
  }
  
  closeCreateForm = () => {
    this.setState({'newFormVisible':false});
  }
  
  signIn = async () => {
    let cburl = document.location.origin + '/oauth_cb.html';
    let provider = 'snow-universal';
    let instance = 'https://ven02275.service-now.com'
  
  
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
    let prefOpts = this.ScreenMeetMain.getSessionPrefOptions(event.target.value);
    this.setState({'newType' : event.target.value, prefOptions: prefOpts});
    
  }
  
  handleOptionChange = (event) => {
    let selectedOpts = this.state.selectedOpts;
    selectedOpts[event.target.name] = event.target.checked;
    this.setState({'selectedOpts' : selectedOpts});
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
          
          {this.state.prefOptions.map((opt) => {
            return <div key={`pref${opt.name}`}>
              <label>
              <input onChange={this.handleOptionChange}
                name={opt.name}
                type='checkbox' checked={this.state.selectedOpts[opt.name]} />
                {opt.label}
              </label>
            </div>
          })}
          
        </div>
        
        <div className='actionRow'>
          <button disabled={this.state.working} onClick={this.createAdhocSession}>Create</button>
          <button disabled={this.state.working} onClick={this.closeCreateForm}>Cancel</button>
        </div>
      </div>
      
    </div>
  }
  
  uuidv4 = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  
  closeCase = (crmcase) => {
    let filtered = _.filter(this.state.crmObjects, (o) => {return o.id != crmcase.id});
    this.updateCrmObject(filtered);
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
        
        {userInfo && <table style={{'width' : '100%'}}>
          <thead>
          <tr>
          <th width="50%">
            All My Sessions <button onClick={() => { this.showCreateForm(); } }>+ New</button>
          </th>
          <th  width="50%">
            CRM Objects Demo <button onClick={this.createCrmObject}>+ Create Case</button>
          </th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>
              {this.state.allSessions.map((s) => {
                return <SupportSession key={'adhoc.'+s.id} session={s} onClose={this.ScreenMeetMain.listUserSessions} instance={this.ScreenMeetMain}/>
              })}
            </td>
            <td>
              {this.state.crmObjects.map((c) => {
                return <CRMCase key={'case.'+c.id} obj={c} onClose={this.closeCase} instance={this.ScreenMeetMain} onRefresh={this.ScreenMeetMain.listUserSessions}/>
              })}
            </td>
          </tr>
          </tbody>
        </table>}
        
        {this.state.newFormVisible && this.renderNewSessionForm()}
      </div>
    );
  }
}

export default App;
