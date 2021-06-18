import React, {Component} from "react";


export default class CRMCase extends Component {
  
  closeCase =async () => {
    if (this.props.onClose) {
      this.props.onClose(this.props.obj);
    }
  }
  
  joinSession = (url) => {
    window.open(url);
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
      
       <button onClick={this.props.onCreateRelateCase}>+ Create Related ScreenMeet Session</button>
      
      <div className='case-related-sessions'>
      
      </div>
    
    </div>
  }
  
}