import AppBar from '@material-ui/core/AppBar';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import Typography from '@material-ui/core/Typography';
import React, { FC } from 'react';
import { ClientResponse, processRequest, ServerRequest, ServerResponse, processRequestOriginal } from './optimization';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { CardContent } from '@material-ui/core';

const ReactHighcharts = require('react-highcharts');

var incrementalRevenueInit:number[] = [0]
var revenuePerDayInit:number[] = [0]
var flowRateInInit:number[] = [0]
var flowRateToOperationsInit:number[] = [0]
var currentPitVolumeInit:number[] = [0]
var maximumPitVolumeInit:number[] = [100000]

function getAvg(array: any[]) {
  if(array.length == 1){
    return 0
  }
  const tempArray = array.slice(1)
  const total = tempArray.reduce((acc, c) => acc + c, 0);
  return total / tempArray.length;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    title: {
      flexGrow: 1,
      textAlign: 'left'
    },
    body: {
      padding: theme.spacing(2),
    },
  }),
);

function rename(response: any[]) { // function to rename on button click
  var responseUpdated = response.map(function(obj) {
      obj['name'] = obj['operationId'];
      obj['y'] = obj['flowRate']
      delete obj['name'];
      delete obj['y']
      return obj;
  });
  return responseUpdated
}

function App() {
  const classes = useStyles();

  const [request, setRequest] = React.useState<null | ServerRequest>(null);
  const [result, setResult] = React.useState<null | ServerResponse>(null);
  const [response, setResponse] = React.useState<null | ClientResponse>(null);
  const [responseOriginal, setResponseOriginal] = React.useState<null | ClientResponse>(null);
  const [incrementalRevenue, setIncrementalRevenue] = React.useState(incrementalRevenueInit);
  const [revenuePerDay, setRevenuePerDay] = React.useState(revenuePerDayInit);
  const [flowRateIn, setFlowRateIn] = React.useState(flowRateInInit);
  const [flowRateToOperations, setFlowRateToOperations] = React.useState(flowRateToOperationsInit);
  const [currentPitVolume, setCurrentPitVolume] = React.useState(currentPitVolumeInit);
  const [maximumPitVolume, setMaximumPitVolume] = React.useState(maximumPitVolumeInit);

  React.useEffect(() => {
    // const ws = new WebSocket('ws://localhost:9172');
    // eslint-disable-next-line no-restricted-globals
    const ws = new WebSocket(`wss://2021-utd-hackathon.azurewebsites.net`);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({setPitCapacity: 100000}));
    })

    // When the server sends new data, we send how to optimally allocate the water
    ws.addEventListener('message', (message) =>{

      if (message.data.startsWith('Error')) {
        window.alert(message.data);
        throw Error(message.data)
      }
      const data = JSON.parse(message.data);
      if (data.type === "CURRENT_STATE") {
        const request: ServerRequest = JSON.parse(message.data);
        setRequest(request);

        const response = processRequest(request)
        const responseOriginal = processRequestOriginal(request)

        setResponse(response)
        setResponseOriginal(responseOriginal)

        ws.send(JSON.stringify(response));
      } else if (data.type === "OPTIMATION_RESULT") {
        const response: ServerResponse = JSON.parse(message.data);
        
        console.log(response);

        incrementalRevenue.push(response.incrementalRevenue)
        setIncrementalRevenue(incrementalRevenue)
        
        revenuePerDay.push(response.revenuePerDay)
        setRevenuePerDay(revenuePerDay)

        flowRateIn.push(response.flowRateIn)
        setFlowRateIn(flowRateIn)

        flowRateToOperations.push(response.flowRateToOperations)
        setFlowRateToOperations(flowRateToOperations)

        if(response.currentPitVolume){
          currentPitVolume.push(response.currentPitVolume)
          setCurrentPitVolume(currentPitVolume)
        }

        if(response.maximumPitVolume){
          maximumPitVolume.push(response.maximumPitVolume)
          setMaximumPitVolume(maximumPitVolume)
        }

        setResult(response);
      }
    });

    // Oh no! Something unexpected happened.
    ws.addEventListener('error', (event) => {
      throw Error(JSON.stringify(event));
    })

    // cleanup function
    return () => {
      ws.close();
    }
  }, [])

  return (
    <div>
     <AppBar position="static" style={{ background: '#7CB5EC' }}>
        <Toolbar>
          <Typography variant="h5" className={classes.title}>
            Water Flow Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      {/* <div className={classes.body}>
        <div>1.) Server Sends Current State of the System:</div>
        <textarea rows={10} cols={150} value={JSON.stringify(request, undefined, 2)} />
        <div>2.) Client Sends Solution to the Optimization:</div>
        <textarea rows={10} cols={150} value={JSON.stringify(response, undefined, 2)}/>
        <div>3.) Server Sends Result:</div>
        <textarea rows={10} cols={150} value={JSON.stringify(result, undefined, 2)}/>
      </div> */}

      <Grid container spacing={1} style={{textAlign: "center",}}>
        <Grid item xs={12} sm={12} md={4} className='text-center'>
          <Card elevation={6}>
            <CardContent>
              <Typography variant="h3" className={classes.title} style={{textAlign: "center",}}>
                $ {Number((revenuePerDay[revenuePerDay.length-1]).toFixed(2))}
              </Typography>
              <Typography variant="h6" className={classes.title} style={{textAlign: "center",}}>
                Revenue/Day
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Card elevation={6}>
            <CardContent>
            <Typography variant="h3" className={classes.title} style={{textAlign: "center",}}>
                {Number((getAvg(flowRateIn)).toFixed(2))}
              </Typography>
              <Typography variant="h6" className={classes.title} style={{textAlign: "center",}}>
              Avg. Flow Rate In (bbls)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Card elevation={6}>
            <CardContent>
            <Typography variant="h3" className={classes.title} style={{textAlign: "center",}}>
            {Number((getAvg(flowRateToOperations)).toFixed(2))}
              </Typography>
              <Typography variant="h6" className={classes.title} style={{textAlign: "center",}}>
              Avg. Flow Rate to Operations (bbls)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} md={9}>
          <Card elevation={6}>
            <CardContent>
              <ReactHighcharts config = {{
                title: {text: 'Incremental Revenue'},
                series: [{name: 'Revenue', data: incrementalRevenue}], 
                yAxis:{title: {text: 'Revenue (in $)'}},
                xAxis:{title: {text: 'Time'}}
              }}></ReactHighcharts>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} md={3}>
          <Card elevation={6}>
            <CardContent>
              {/* <h1>Pit Capacity</h1> */}
              <ReactHighcharts config = {{
                chart: {plotBackgroundColor: null,plotBorderWidth: null,plotShadow: false,type: 'pie'},
                colors: ['#00008b', '#bc8f8f'],
                tooltip: {pointFormat: '{series.name}: <b>{point.percentage:.4f}%</b>'},
                accessibility: {point: {valueSuffix: '%'}},
                title: {text: 'Pit Capacity'},
                series: [{name: 'Status',colorByPoint: true, data: [{name:'Water', y:currentPitVolume[currentPitVolume.length - 1]}, {name:'Empty', y:maximumPitVolume[maximumPitVolume.length - 1] - currentPitVolume[currentPitVolume.length - 1]}]}], 
              }}></ReactHighcharts>
              {/* <h2>$ {Number((currentPitVolume[currentPitVolume.length - 1]).toFixed(2))}</h2> */}
              {/* <h2>$ {Number((maximumPitVolume[maximumPitVolume.length - 1]).toFixed(2))}</h2> */}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} md={9}>
          <Card elevation={6}>
            <CardContent>
                {response && responseOriginal ? (
                  <ReactHighcharts config = {{
                    title: {text: 'Water Distribution'},
                    series: [{name: 'Our Algo', data: response.map(value => value.flowRate)}, {name: 'Original Algo', data: responseOriginal.map(value => value.flowRate)}], 
                    yAxis:{title: {text: 'Amount of Water (bbls)'}},
                    xAxis:{title: {text: 'Operations', categories: response.map(value => value.operationId)}}
                  }}></ReactHighcharts>
                ) : (
                  <ReactHighcharts config = {{
                    title: {text: 'Water Distribution'},
                    yAxis:{title: {text: 'Amount of Water (bbls)'}},
                    xAxis:{title: {text: 'Operations'}}
                  }}></ReactHighcharts>
                )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} md={3}>
          <Card elevation={6}>
            <CardContent>

              <ReactHighcharts config = {{
                chart:{type:'column'},
                colors: ['#00008b', '#7CB5EC'],
                title: {text: 'Inflow/ Outflow'},
                plotOptions: {column: {grouping: false}},
                series: [{name: 'Inflow', data: flowRateIn.slice(-5)} , {name: 'Outflow', data: flowRateToOperations.slice(-5)}], 
                yAxis:{title: {text: 'Amount of Water (bbls)'}},
                xAxis:{title: {text: 'Time'}}
              }}></ReactHighcharts>

            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* <ReactHighcharts config = {{title: {text: 'revenuePerDay chart'},series: [{name: 'Revenue Per Day', data: revenuePerDay}], yAxis:{title: {text: 'Revenue (in $)'}}}}></ReactHighcharts> */}
      {/* <ReactHighcharts config = {{title: {text: 'flowRateIn chart'},series: [{data: flowRateIn}]}}></ReactHighcharts> */}
      {/* <ReactHighcharts config = {{title: {text: 'flowRateToOperations chart'},series: [{data: flowRateToOperations}]}}></ReactHighcharts> */}
    </div>
  );
}

export default App;
