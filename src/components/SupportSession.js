import {Component} from "react";


export default class SupportSession extends Component {
  
  closeSession =async () => {
    await this.props.instance.closeSession(this.props.session.id);
    if (this.props.onClose) {
      this.props.onClose();
    }
  }
  
  joinSession = (url) => {
    window.open(url);
  }
  
  
  render() {
    const {session, instance} = this.props;
    let urls = instance.getUrls(session);
    
    return <div className={`session session-${session.status}`}>
      <div className='label'>
        [{session.type}] {session.label} <button onClick={this.closeSession}>X</button>
      </div>
      <div>
        pin: {session.pin}<br/>
        id: {session.id}<br/>
        status: {session.status}
      </div>
      {urls.invite && <div className='url'>
        <b>Invite URL</b><br/>
        <a href={urls.invite} target='_blank'>{urls.invite}</a>
      </div>}
      { ( (urls.host && session.status === 'active') || session.type === 'live') && <div className='url url-host'>
        <button onClick={() => {window.open(urls.host); }}>JOIN SESSION</button>
      </div> }
      
    </div>
  }
  
}