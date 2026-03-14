import type { KnowledgeLifecyclePort } from "../../application/knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
import type {
  RemoveSourceInput,
  ReprocessContextInput,
  RollbackContextInput,
  LinkContextsInput,
  UnlinkContextsInput,
  CreateContextInput,
  ArchiveContextInput,
  DeprecateContextInput,
  ActivateContextInput,
  GetContextLineageInput,
  GenerateProjectionInput,
} from "../../application/knowledge-lifecycle/contracts/dtos";
import { toRESTResponse } from "../shared/resultTransformers";
import type { RESTRequest, RESTResponse } from "../shared/resultTransformers";

export class KnowledgeLifecycleRESTAdapter {
  constructor(private readonly _lifecycle: KnowledgeLifecyclePort) {}

  async removeSource(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RemoveSourceInput;
    const result = await this._lifecycle.removeSource(input);
    return toRESTResponse(result);
  }

  async reprocessContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ReprocessContextInput;
    const result = await this._lifecycle.reprocessContext(input);
    return toRESTResponse(result);
  }

  async rollbackContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as RollbackContextInput;
    const result = await this._lifecycle.rollbackContext(input);
    return toRESTResponse(result);
  }

  async linkContexts(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as LinkContextsInput;
    const result = await this._lifecycle.linkContexts(input);
    return toRESTResponse(result);
  }

  async unlinkContexts(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as UnlinkContextsInput;
    const result = await this._lifecycle.unlinkContexts(input);
    return toRESTResponse(result);
  }

  async createContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as CreateContextInput;
    const result = await this._lifecycle.createContext(input);
    return toRESTResponse(result);
  }

  async archiveContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ArchiveContextInput;
    const result = await this._lifecycle.archiveContext(input);
    return toRESTResponse(result);
  }

  async deprecateContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as DeprecateContextInput;
    const result = await this._lifecycle.deprecateContext(input);
    return toRESTResponse(result);
  }

  async activateContext(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as ActivateContextInput;
    const result = await this._lifecycle.activateContext(input);
    return toRESTResponse(result);
  }

  async getContextLineage(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as GetContextLineageInput;
    const result = await this._lifecycle.getContextLineage(input);
    return toRESTResponse(result);
  }

  async generateProjection(req: RESTRequest): Promise<RESTResponse> {
    const input = req.body as GenerateProjectionInput;
    const result = await this._lifecycle.generateProjection(input);
    return toRESTResponse(result);
  }
}
