
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

// You should do better!
export function processRequest(request: ServerRequest): ClientResponse {
  var flowRateIn = request.flowRateIn;
  var operations = request.operations;

  var flowRateArray = [];
  var freeMoney = [];
  var solution: { [id: string]: Sol; }
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
            flowRateArray.push({
            "operationId": operationId,
            "flowPerDay": revenueStructure[j].flowPerDay,
            "dollorsperDay":revenueStructure[j].dollarsPerDay,
            "ratio": revenueStructure[j].dollarsPerDay/ revenueStructure[j].flowPerDay
            })
        }
    }
  }

  flowRateArray.sort((a, b) => (a.ratio > b.ratio) ? -1 : 1)
  console.log(flowRateArray);
  console.log(freeMoney)

  var flow = flowRateIn;
  if(flow >= flowRateArray[0]["flowPerDay"]){
    solution_array.push({"operationId":flowRateArray[0]["operationId"],"flowRate":flowRateArray[0]["flowPerDay"]});
    flow = flow - flowRateArray[0]["flowPerDay"]
  }

  for (let i = 1; i < flowRateArray.length; i++) {
    if (flow >= flowRateArray[i]["flowPerDay"] &&(flow > 0)) {
      let j : number
      for(j = 0; j < solution_array.length; j++){
        console.log("start")
        console.log(i,j)
         if(flowRateArray[i]["operationId"] == solution_array[j]["operationId"]){
           console.log("True")
           let sum : number = 0 
           sum = flowRateArray[i]["flowPerDay"] + solution_array[j]["flowRate"]
           solution_array[j]["flowRate"] = sum;
           break
         }
         else{
           console.log("False")
         }
      }
      if (j == solution_array.length){
        solution_array.push({"operationId":flowRateArray[i]["operationId"],"flowRate":flowRateArray[i]["flowPerDay"]});
       }
      flow = flow - flowRateArray[i]["flowPerDay"]
    }
  }
  console.log(operations.length)


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
  console.log(solution_array)

  return solution_array

  // const evenDistribution = request.flowRateIn / request.operations.length;
  // return request.operations.map(operation => {
  //   return {
  //     operationId: operation.id,
  //     flowRate: evenDistribution - 10,
  //   }
  // })
}