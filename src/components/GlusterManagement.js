import React, { Component } from 'react'
import Redirect from 'react-router'
import GdeploySetup from './gdeploy/GdeploySetup'

const classNames = require('classnames');

class GlusterManagement extends Component {

  constructor(props) {
    super(props);
    this.state = {
      volumeSelectedRow: 'None',
      //refactor this variable name to host_list or host_json or something
      host: {},
      volumeBricks: {},
      volumeInfo: {},
      volumeStatus: {},
      hostStatus: false,
      volumeStatusStatus: false,
      volumeInfoStatus: false,
      volumeBricksStatus: false,
      gdeployState: "",
      gdeployWizardType: ""
    };
    this.handleVolumeRowClick = this.handleVolumeRowClick.bind(this);
    this.getVolumeStatus = this.getVolumeStatus.bind(this);
    this.getVolumeStatus = this.getVolumeStatus.bind(this);
    this.getHostList = this.getHostList.bind(this);
    this.startGlusterManagement = this.startGlusterManagement.bind(this);
    this.applyGlusterChanges = this.applyGlusterChanges.bind(this);
    this.abortCallback = this.abortCallback.bind(this);
  }

  componentDidMount() {
    let that = this
    this.getHostList(function (hostJson) {
      that.getVolumeStatus(function (volumeStatusJson) {
        that.getVolumeInfo(function (volumeInfoJson) {
          let volumeBricks = {}
          if(Object.keys(volumeInfoJson).length != 0 && Object.keys(volumeStatusJson).length != 0) {
            Object.keys(volumeInfoJson.volumes).forEach(function (volume) {
              volumeBricks[volume] = []
              // Object.values(volumeStatusJson.volumeStatus.bricks).forEach(function (brick) {
              volumeStatusJson.volumeStatus.bricks.forEach(function (brick) {
                if(brick.brick.match(volume)) {
                  volumeBricks[volume].push(brick)
                }
              })
            })
          }
          that.setState({
            host: hostJson,
            hostStatus: true,
            volumeStatus: volumeStatusJson,
            volumeStatusStatus: true,
            volumeInfo: volumeInfoJson,
            volumeInfoStatus: true,
            volumeBricks: volumeBricks,
            volumeBricksStatus: true
          })
        })
      })
    })
  }

  getHostList(callback){
    cockpit.spawn(
      // [ "vdsm-client", "--gluster-enabled", "GlusterHost", "list" ]
      ["cat","/home/admin/dummy_1.txt"]
    ).done(function(list) {
      if(list != null || list != undefined) {
        let poolList = JSON.parse(list)
        poolList.hosts.forEach(function (host, index) {
          if(host.hostname.indexOf("/") != -1) {
            host.hostname = host.hostname.split("/")[0]
          }
        })
        callback(poolList)
      } else {
        console.log("HostList is empty");
        callback({})
      }
    }).fail(function(err){
      console.log("Error while fetching pool list: ", err);
      callback({})
    })
  }

  getVolumeStatus(callback) {
    cockpit.spawn(
      // ["vdsm-client", "--gluster-enabled", "GlusterVolume", "status", "volumeName=all"]
      ["cat","/home/admin/dummy_2.txt"]
    ).done(function(volumeStatusList){
      callback(JSON.parse(volumeStatusList))
    }).fail(function(err){
      console.log("Error while fetching volume status: ", err);
      callback({})
    })
  }

  getVolumeInfo(callback) {
    cockpit.spawn(
      // ["vdsm-client", "--gluster-enabled", "GlusterVolume", "list"]
      ["cat","/home/admin/dummy_3.txt"]
    ).done(function(volumeInfoList){
      console.log(JSON.parse(volumeInfoList))
      callback(JSON.parse(volumeInfoList))
    }).fail(function(err){
      console.log("Error while fetching volume info: ", err);
      callback({})
    })
  }

  handleVolumeRowClick(volume) {
    this.setState({
      //unselects if already selected.
      volumeSelectedRow: this.state.volumeSelectedRow == volume ? 'None':volume
    })
    }
  handleCreateVolume(){
  window.top.location.href='/ovirt-dashboard-dev#/create_gluster_volume';
  }
  handleExpandCluster(){
  window.top.location.href='/ovirt-dashboard-dev#/expand_cluster';
  }
  startGlusterManagement(action) {
      //set the relevant wizard to MANAGE
      let gdeployWizardType = action
      let gdeployState = "MANAGE"
      this.setState({ gdeployWizardType, gdeployState })
  }

  applyGlusterChanges(){
      this.setState({
          gdeployState: "",
          gdeployWizardType: ""
      })
  }

  abortCallback(){
      this.setState({
          gdeployState: "",
          gdeployWizardType: ""
      })
  }

  render() {

    let hostsTable = null
    let bricksTable = null
    let volumesTable = null
    let modalWindow = null
    let options = null

    //generate hosts table
    if (Object.keys(this.state.host).length != 0) {
        hostsTable = []
        this.state.host.hosts.forEach(function(host, index) {
        let uuid = "uuid: " + host.uuid
        hostsTable.push(
          <li key={index} className="list-group-item">
            <div className="row">
              <div className="col-sm-6">
                {host.hostname} <span className="fa fa-info-circle" title={uuid}></span>
              </div>
              <div className="col-sm-6">
                {host.status}
              </div>
            </div>
          </li>
        )
      }, this)
    }
    //generate brickstable
    if (Object.keys(this.state.volumeBricks).length != 0) {
      if(this.state.volumeSelectedRow !== 'None') {
        bricksTable = []
        this.state.volumeBricks[this.state.volumeSelectedRow].forEach(function (brick, index) {
          let hostuuid = "hostuuid: " + brick.hostuuid
          let pid = "pid: " + brick.pid
          let rdma_port = ""
          if(brick.rdma_port && ((brick.rdma_port).length != 0)) {
            rdma_port = "rdma_port: " + brick.rdma_port
          }
          let port = "port: " + brick.port
          let info = hostuuid + '\n' + pid + '\n' + 'rdma_port' + '\n' + port
          bricksTable.push(
            <li key={index} className="list-group-item">
              <div className="row">
                <div className="col-sm-8">
                  {brick.brick} <span className="fa fa-info-circle" title={info}></span>
                </div>
                <div className="col-sm-4">
                  {brick.status}
                </div>
              </div>
            </li>
          )
        }, this)
      }
    }
    //modalwindow displays volumeinfo as a list of key values on the expanded volume
    if (this.state.volumeSelectedRow != 'None') {
      if (Object.keys(this.state.volumeInfo).length != 0) {
        modalWindow = []
        options = []
        let volumeTemp = this.state.volumeInfo.volumes[this.state.volumeSelectedRow]
        let that = this
        Object.keys(volumeTemp).forEach(function (key, index) {
          let values = volumeTemp[key]
          //bools replaced with strings
          if (values === false) {
            values="false"
          } else if (values === true) {
            values="true"
          }
          //bools are replaced with strings, why check for bools?
          if(typeof(values) == 'string' || typeof(values) == 'boolean') {
            modalWindow.push(
              <ul key={index} className="list-unstyled">
                <li><strong>{key}</strong> {values}</li>
              </ul>
            )
          } else if((typeof(values) != 'string' || typeof(values) != 'boolean')
          && !(key.match('bricks')) && !(key.match('options'))) {
            volumeTemp[key].forEach(function (props, index) {
              modalWindow.push(
                <ul key={index} className="list-unstyled">
                  <li><strong>{key}</strong> {props}</li>
                </ul>
              )
            })
          }
        })
      }
    }
    //volumesTable generated
    if (Object.keys(this.state.volumeInfo).length != 0) {
      volumesTable = []
      Object.keys(this.state.volumeInfo.volumes).forEach(function(volume, index) {
        let volumeTemp = this.state.volumeInfo.volumes[volume]
        let countUp = 0
        let countDown = 0
        this.state.volumeBricks[volume].forEach(function (brick) {
          if(brick.status == 'ONLINE') {
            countUp++
          } else {
            countDown++
          }
        })
        volumesTable.push(
          <li key={index} className="list-group-item" onClick={this.handleVolumeRowClick.bind(this, volumeTemp.volumeName)}>
            <div className="row" style={{backgroundColor: this.state.volumeSelectedRow == volumeTemp.volumeName ? "#cfcfd1":"white"}}>
              <div className="col-sm-2">
                {volumeTemp.volumeName}
              </div>
              <div className="col-sm-2">
                Default
              </div>
              <div className="col-sm-2">
                {volumeTemp.volumeType}
              </div>
              <div className="col-sm-2">
                {volumeTemp.volumeStatus}
              </div>
              <div className="col-sm-2">
                <i className="fa fa-caret-up statusIcon" aria-hidden="true"> {countUp}</i>
                <i className="fa fa-caret-down statusIcon" aria-hidden="true"> {countDown}</i>
              </div>
              <div>
                <button className="btn btn-link btn-find" title="More Info" type="button" data-toggle="modal" data-target="#about-modal">
                  <span className="fa fa-lg fa-info-circle"></span>
                </button>
              </div>
            </div>
            <div className="bricksList" style={{display: this.state.volumeSelectedRow == volumeTemp.volumeName ? "block":"none"}}>
              <ul className="list-group">
                <li className="list-group-item">
                  <div className="row">
                    <div className="col-sm-8">
                      <strong>Brick</strong>
                    </div>
                    <div className="col-sm-4">
                      <strong>Status</strong>
                    </div>
                  </div>
                </li>
                {bricksTable}
              </ul>
            </div>
          </li>
        )
      }, this)
    }

    return (

      <div>
        { !this.state.hostStatus &&
          !this.state.volumeStatusStatus &&
          !this.state.volumeInfoStatus &&
          !this.state.volumeBricksStatus &&
          <div className="spinner spinner-lg"/>
        }
        { this.state.hostStatus &&
          this.state.volumeStatusStatus &&
          this.state.volumeInfoStatus &&
          this.state.volumeBricksStatus &&
          <div>
            <div className="glusterHeading">
              <h1>Gluster Management</h1>
            </div>
            <div className="hostList">
              <div className="glusterHeading">
                <h2>Hosts</h2>
              </div>
              <ul className="list-group">
                <li className="list-group-item">
                  <div className="row">
                    <div className="col-sm-6">
                      <strong>Name</strong>
                    </div>
                    <div className="col-sm-6">
                      <strong>Peer Status</strong>
                    </div>
                  </div>
                </li>
                {hostsTable}
              </ul>
              <div className="manageGlusterButtons">
                {/* <button onClick={this.startGlusterManagement.bind(this, 'expand_cluster')}>Expand Cluster</button> */}
                <button onClick={this.handleExpandCluster}>Expand Cluster</button>
              </div>
            </div>
            <div className="volumeList">
              <div className="glusterHeading">
                <h2>Volumes</h2>
              </div>
              <ul className="list-group">
                <li className="list-group-item">
                  <div className="row">
                    <div className="col-sm-2">
                      <strong>Name</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Cluster</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Volume Type</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Volume Status</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Bricks</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong></strong>
                    </div>
                  </div>
                </li>
                {volumesTable}
              </ul>
              <div className="manageGlusterButtons">
                {/* <button onClick={this.startGlusterManagement.bind(this, 'create_volume')} >Create Volume</button> */}
                <button onClick={this.handleCreateVolume} >Create Volume</button>
              </div>
            </div>
            <div className="modal fade" id="about-modal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content about-modal-pf">
                  <div className="modal-header">
                    <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                      <span className="pficon pficon-close"></span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <h1>More Info</h1>
                    <div className="product-versions-pf">
                      {modalWindow}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        {/* {this.state.gdeployState === "MANAGE" &&
      <Redirect to="/ovirt-dashboard-dev#/create_gluster_volume"/>
            <GdeploySetup onSuccess={this.applyGlusterChanges} onClose={this.abortCallback} gdeployWizardType={this.state.gdeployWizardType} />
        } */}
      </div>
    )
  }
}

export default GlusterManagement
