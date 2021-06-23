import React, {Component} from "react";
import {ScreenMeet} from "@screenmeet/js-sdk";
import SupportSession from "./SupportSession";

/**
 * Demonstrating how to create sessions for related objects...
 */
export default class CRMCase extends Component {
  
  state = {
    newFormVisible: false,
    newName: '',
    newType: 'support',
    working: false,
    allSessions : [], //used to track/render all user sessions
    prefOptions: [],
    selectedOpts : {}
  }
  
  
  componentDidMount() {
    let smrelatedParams = {
      "mode": "object",
      "persistAuth": true,
      "trackSessionState": true, //will poll for session states for all widgets
      "cbdeployments": true,
    };
    this.ScreenMeetMain = new ScreenMeet(smrelatedParams);
    this.ScreenMeetMain.on("signout", () => { this.setState({'allSessions' : []})  });
    this.ScreenMeetMain.on("updated", (sessions) => { this.setState({'allSessions' : Object.values(sessions) });} );
  
    if (this.ScreenMeetMain.isAuthenticated()) {
      this.refreshSessions(false);
    }
    
  }
  
  //syntactic sugar to re-poll sessions assicuated wuth thus this object
  refreshSessions = (refreshAll=true) => {
    this.ScreenMeetMain.listRelatedObjectSessions(this.getObjectKey());
    if (refreshAll && this.props.onRefresh) {
      this.props.onRefresh();
    }
  }
  
  componentWillUnmount() {
    //cleans a bunch of stuff up
    this.ScreenMeetMain.destroy();
  }
  
  closeCase =async () => {
    if (this.props.onClose) {
      this.props.onClose(this.props.obj);
    }
  }
  
  //creates unique identifier for this object
  getObjectKey = () => {
    return `reactdemoapp.case.${this.props.obj.id}`;
  }
  
  showCreateForm = () => {
    let prefOpts = this.ScreenMeetMain.getSessionPrefOptions(this.state.newType);
    this.setState({'newFormVisible':true, 'newName' : this.props.obj.name, prefOptions: prefOpts});
  }
  
  closeCreateForm = () => {
    this.setState({'newFormVisible':false});
  }
  
  //invoked via create form
  createRelatedSession = async (instance, object) => {
    this.setState({'working':true});
    
    let parentObject =  {
      'id' : this.props.obj.id,
      'app ' : 'reactdemoapp',
      'type' : 'case', //object type
      'name' : this.state.newName, //name of object - goes into label field
      'sync' : false
    };
    
    let objectKey = this.getObjectKey();
    
    //prefs would go here (not implemented)
    let prefs = this.state.selectedOpts;
    
    
    try {
      let result = await this.ScreenMeetMain.createRelatedSession(this.state.newType, this.state.newName, prefs,parentObject,objectKey,this.ScreenMeetMain.global.me.user.name);
      console.log(`Session created`, result);
      this.refreshSessions(true);
    } catch (er) {
      console.error(er);
    }
    
    this.setState({'working':false, 'newFormVisible' : false})
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
            return <div key={`pref${opt.name}`} >
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
          <button disabled={this.state.working} onClick={this.createRelatedSession}>Create</button>
          <button disabled={this.state.working} onClick={this.closeCreateForm}>Cancel</button>
        </div>
      </div>
    
    </div>
  }
  
  render() {
    const {obj, instance} = this.props;
    
    return <div className={`case`}>
      <div><b>
        [{obj.name}] <button  className='closebutton' onClick={this.closeCase}>X</button>
      </b>
      </div>
      <div>
        id: {obj.id}<br/>
      </div>
      
       <button onClick={this.showCreateForm}>+ Create Related ScreenMeet Session</button>
      
      <div className='case-related-sessions'>
        {this.state.allSessions.map((s) => {
          return <SupportSession key={`case.`+s.id} session={s} onClose={this.refreshSessions} instance={this.ScreenMeetMain}/>
        })}
      </div>
      {this.state.newFormVisible && this.renderNewSessionForm()}
    </div>
  }
  
}