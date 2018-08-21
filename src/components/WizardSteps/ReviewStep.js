import React, { Component } from 'react'
import {
  Grid,
  Row,
  Col,
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Checkbox
  } from 'patternfly-react'
import { notEmpty } from '../common/validators'
import Dropdown from '../common/Dropdown'
import yaml from 'js-yaml';

class ReviewStep extends Component {
  constructor(props){
    super(props)
    this.state = {
      isEditing: false,
      inventory: this.generateInventory(this.props.glusterModel)
    }
  }

  handleEmpty = (po) => {
    return JSON.stringify(po) == '{}' ? "" : po;
  }
  uniqueStringsArray = (arr) => {
      var u = {}, a = [];
      for(var i = 0, l = arr.length; i < l; ++i){
          if(!u.hasOwnProperty(arr[i])) {
              a.push(arr[i]);
              u[arr[i]] = 1;
          }
      }
      return a;
  }
  generateInventory = (glusterModel) =>{
    let groups = {};
    let { hosts, volumes, bricks, raidConfig, cacheConfig } = glusterModel;
    groups.hc_nodes = {};
    groups.hc_nodes.hosts = {};
    let groupVars = {}
    groupVars.gluster_infra_stripe_unit_size = raidConfig.stripe_size;
    groupVars.gluster_infra_disktype = raidConfig.raid_type;
    groupVars.gluster_infra_diskcount = raidConfig.disk_count;


    for (let hostIndex = 0; hostIndex < hosts.length;hostIndex++){
      let hostVars = {}
      let hostBricks = bricks[hostIndex]
      hostVars.gluster_infra_lv_thicklvname = `gluster_lv_${hostBricks[0].volName}`
      hostVars.gluster_infra_lv_thicklvsize = `gluster_lv_${hostBricks[0].size}`

      hostVars.gluster_infra_pvs = this.uniqueStringsArray(hostBricks.map((brick)=>brick.device));
      hostVars.gluster_infra_lv_logicalvols = hostBricks
      .slice(1,hostBricks.length)
      .map((brick)=>{
        return {
          lvname: `gluster_lv_${brick.volName}`,
          lvsize: `${brick.size}G`
        };
      });
      hostVars.gluster_infra_mount_devices = hostBricks.map((brick)=>{
        return {
          path: brick.mountPoint,
          lv: `gluster_lv_${brick.volName}`
        }
      });
      groups.hc_nodes.hosts[hosts[hostIndex]] = hostVars;
    }

    // groupVars.gluster_infra_lv_logicalvols = [];
    // for(let volumeIndex = 0; volumeIndex < volumes.length;volumeIndex++){
    //   let volume = volumes[volumeIndex];
    //
    // }
    groups.hc_nodes.vars = groupVars;

    return yaml.safeDump(groups)

  }
  handleEdit = (event) => {
    this.setState({isEditing:true});
  }
  handleSave = (event) => {
    this.setState({isEditing:false});
  }
  handleTextChange = (event) => {
    this.setState({inventory: event.target.value});
  }
  render(){
    return (
      <Grid fluid>
        <Row>
          <Col sm={12}>
            <div className="panel panel-default">
    <div className="panel-heading">
        <span className="pficon-settings"></span>
        <span>
            Generated ansible inventory : {this.props.configFilePath}
        </span>
        <div className="pull-right">
          {this.state.isEditing &&
            <button className="btn btn-default"
              onClick={this.handleSave}>
              <span className="pficon pficon-save">&nbsp;</span>
              Save
            </button>
          }
          {!this.state.isEditing &&
            <button className="btn btn-default"
                onClick={this.handleEdit}>
                <span className="pficon pficon-edit">&nbsp;</span>
                Edit
            </button>
          }
            <button className="btn btn-default"
              onClick={this.handleReload}>
              <span className="fa fa-refresh">&nbsp;</span>
              Reload
            </button>
        </div>
    </div>
    <textarea className="wizard-preview"
        value={this.state.inventory} onChange={this.handleTextChange} readOnly={!this.state.isEditing}>
    </textarea>
</div>

          </Col>
        </Row>
      </Grid>
    );
  }
}




export default ReviewStep