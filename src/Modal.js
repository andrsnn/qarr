import React from "react";
export class Modal extends React.Component {
  state = {
    name: '',
    password: '',
    hidden: false
  };
  handleChange = (key, e) => {
    this.setState({
      [key]: e.target.value
    });
  };
  componentDidMount() {
    document.querySelector('html').classList.add('modal-is-open');
  }
  componentWillUnmount() {
    document.querySelector('html').classList.remove('modal-is-open');
  }
  render() {
    return (<div className="modal" style={{ display: 'block' }}>
      <div className="modal-background"></div>
      <div className="modal-card" style={{ marginTop: '20px' }}>
        <header className="modal-card-head">
          <p className="modal-card-title">Create Wifi QR code</p>
          <button className="delete" onClick={this.props.onCancel} aria-label="close"></button>
        </header>
        <section className="modal-card-body">
          <div className="field">
            <label className="label">Name</label>
            <div className="control">
              <input className="input" type="text" placeholder="Enter network name..." onChange={this.handleChange.bind(this, 'name')} value={this.state.name} />
            </div>
          </div>
          <div className="field">
            <label className="label">Password</label>
            <div className="control">
              <input className="input" type="password" autoComplete="off" placeholder="Enter password..." onChange={this.handleChange.bind(this, 'password')} value={this.state.password} />
            </div>
          </div>
          <label className="checkbox">
            <input type="checkbox" onChange={this.handleChange.bind(this, 'hidden')} value={this.state.hidden} />
            <span>  Hidden</span>
          </label>
        </section>
        <footer className="modal-card-foot">
          <button onClick={() => this.props.onSave({
            name: this.state.name,
            password: this.state.password,
            hidden: this.state.hidden
          })} className="button is-success">Done</button>
          <button onClick={this.props.onCancel} className="button">Cancel</button>
        </footer>
      </div>
    </div>);
  }
}
