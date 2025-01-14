import { ServerResponse } from "http";
import { IApiResponse } from "../engine";

export class NodeApiResponse implements IApiResponse<ServerResponse> {
  static _map = new WeakMap<ServerResponse, IApiResponse<ServerResponse>>();

  static for(res: ServerResponse): IApiResponse<ServerResponse> {
    let apiResponse = this._map.get(res);
    if (apiResponse != null) {
      return apiResponse;
    }

    apiResponse = new NodeApiResponse(res);
    this._map.set(res, apiResponse);
    return apiResponse;
  }

  constructor(private _res: ServerResponse) {}

  getWrapped(): ServerResponse {
    return this._res;
  }

  setStatus(code: number): void {
    this._res.statusCode = code;
  }

  end(chunk: string): void {
    this._res.end(chunk);
  }
}
