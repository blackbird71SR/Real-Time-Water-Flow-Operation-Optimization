import { PassThrough } from "stream";

export interface Point {
  flowPerDay: number,
  dollarsPerDay: number,
}
interface WaterOperation {
  name: string,
  id: string,
  revenueStructure: Point[],
}

export interface ServerRequest {
  flowRateIn: number;
  operations: WaterOperation[];
  type: "CURRENT_STATE";
};

export interface ServerResponse {
  incrementalRevenue: number,
  revenuePerDay: number,
  flowRateIn: number,
  flowRateToOperations: number,
  type: "OPTIMATION_RESULT",
  currentPitVolume?: number ,
  maximumPitVolume?: number ,
}

export type ClientResponse = {
  operationId: string,
  flowRate: number,
}[];

interface Sol {
  operationId: string;
  flowRate: number;
}

export function processRequestOriginal(request: ServerRequest): ClientResponse {
  const evenDistribution = request.flowRateIn / request.operations.length;
  return request.operations.map(operation => {
    return {
      operationId: operation.id,
      flowRate: evenDistribution - 10,
    }
  })
}

var avg_ratio : number = 0.0
var pit_flag : boolean = true
var pit_size : number = 100000
var pit_water : number = 0

// ws.addEventListener('open',  ()  =>  {
// 	ws.send(JSON.stringify({setPitCapacity:  100000}));
// })


// You should do better!
export function processRequest(request: ServerRequest): ClientResponse {
  var flowRateIn = request.flowRateIn + pit_water;
  var operations = request.operations;

  var flowRateArray = [];
  var freeMoney = [];

  var solution_array : ClientResponse = []

  for (let i = 0; i < operations.length; i++) {
    var operation = operations[i];
    var operationId : string= operation.id;
    var revenueStructure = operation.revenueStructure;
    for (let j = 0; j < revenueStructure.length; j++) {

      if (revenueStructure[j].flowPerDay == 0 && revenueStructure[j].dollarsPerDay > 0) {
        freeMoney.push({
          "operationId": operationId,
          "flowPerDay": revenueStructure[j].flowPerDay,
          "dollorsperDay":revenueStructure[j].dollarsPerDay,
          "ratio": revenueStructure[j].dollarsPerDay
        })
      } else if ((revenueStructure[j].flowPerDay != 0) && (revenueStructure[j].dollarsPerDay > 0)) {
            var r : number = revenueStructure[j].dollarsPerDay/ revenueStructure[j].flowPerDay
            avg_ratio = (avg_ratio + r)/2;
            flowRateArray.push({
            "operationId": operationId,
            "flowPerDay": revenueStructure[j].flowPerDay,
            "dollorsperDay":revenueStructure[j].dollarsPerDay,
            "ratio": avg_ratio
            })
        }
    }
  }

  flowRateArray.sort((a, b) => (a.ratio > b.ratio) ? -1 : 1)
  // console.log(flowRateArray);
  // console.log(freeMoney)

  var flow = flowRateIn;
  if(flow >= flowRateArray[0]["flowPerDay"]){
    solution_array.push({"operationId":flowRateArray[0]["operationId"],"flowRate":flowRateArray[0]["flowPerDay"]});
    flow = flow - flowRateArray[0]["flowPerDay"]
  }

  var end_intake_index : number = -1
  var i : number = 0
  for (i = 1; i < flowRateArray.length; i++) {
    if (flow >= flowRateArray[i]["flowPerDay"] &&(flow > 0)) {
      let j : number
      if(pit_flag){
        if((flowRateArray[i]["ratio"] < (avg_ratio/2)) && ((pit_size - pit_water) >= flowRateArray[i]["flowPerDay"])){
          pit_water = pit_water + flowRateArray[i]["flowPerDay"]
          end_intake_index = i - 1
          flow = flow - flowRateArray[i]["flowPerDay"]
          break
        }
      }

      for(j = 0; j < solution_array.length; j++){
        // console.log("start")
        // console.log(i,j)
         if(flowRateArray[i]["operationId"] == solution_array[j]["operationId"]){
           //console.log("True")
           let sum : number = 0 
           sum = flowRateArray[i]["flowPerDay"] + solution_array[j]["flowRate"]
           solution_array[j]["flowRate"] = sum;
           break
         }
         //else{
          //  console.log("False")
         //}
      }
      if (j == solution_array.length){
        solution_array.push({"operationId":flowRateArray[i]["operationId"],"flowRate":flowRateArray[i]["flowPerDay"]});
       }
      flow = flow - flowRateArray[i]["flowPerDay"]
    }
  }
  end_intake_index = i - 1
  console.log(operations.length)

  // Code : Fractional residual ( Pit redirection - if available)
  if(flow > 0){
    if(!pit_flag){
      if(end_intake_index < (flowRateArray.length - 1)){
        solution_array.push({"operationId":flowRateArray[end_intake_index + 1]["operationId"],"flowRate":flowRateArray[end_intake_index + 1]["flowPerDay"]});
      }
    }
    else{
      if((pit_size - pit_water) >= flow){
        pit_water = pit_water + flow;
        flow = 0
      }
      else{
        flow = flow - (pit_size - pit_water)
        pit_water = pit_size;
      }
    }
  }

  // Code : Zero distributions
  for (let i = 0; i < operations.length; i++) {
    var flag = 0
    for(let j = 0; j < solution_array.length; j++){
      if (operations[i].id == solution_array[j]["operationId"]){
        flag = 1;
        break
      }
    }
    if (flag == 0){
      solution_array.push({"operationId":operations[i].id,"flowRate":0});
    }
    }
  
  console.log(solution_array.length)
  // console.log(solution_array)

  return solution_array

  // const evenDistribution = request.flowRateIn / request.operations.length;
  // return request.operations.map(operation => {
  //   return {
  //     operationId: operation.id,
  //     flowRate: evenDistribution - 10,
  //   }
  // })
}