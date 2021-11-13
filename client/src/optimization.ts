
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

// You should do better!
export function processRequest(request: ServerRequest): ClientResponse {
  var flowRateIn = request.flowRateIn;
  var operations = request.operations;

  var flowRateArray = [];
  var freeMoney = [];

  for (let i = 0; i < operations.length; i++) {
    var operation = operations[i];
    var operationId = operation.id;
    var revenueStructure = operation.revenueStructure;
    for (let j = 0; j < revenueStructure.length; j++) {

      if (revenueStructure[j].flowPerDay == 0 && revenueStructure[j].dollarsPerDay > 0) {
        freeMoney.push({
          "operationId": operationId,
          "flowPerDay": revenueStructure[j].flowPerDay,
          "dollorsperDay":revenueStructure[j].dollarsPerDay,
          "ratio": revenueStructure[j].dollarsPerDay
        })
      } else if (revenueStructure[j].flowPerDay != 0 && revenueStructure[j].dollarsPerDay > 0) {
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
  
  const evenDistribution = request.flowRateIn / request.operations.length;
  return request.operations.map(operation => {
    return {
      operationId: operation.id,
      flowRate: evenDistribution - 10,
    }
  })
}