/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface CreateTeamDto {
  /**
   * The name of the team
   * @example "Team 1"
   */
  name: string;
}

export interface InviteMemberDto {
  /**
   * The email of the member to invite
   * @example "luke@wizlab.org"
   */
  email: string;
}

export interface CreateWorkflowDto {
  /**
   * The name of the workflow
   * @example "Workflow 1"
   */
  name: string;
}

export interface UpdateWorkflowDto {
  /** The status of the workflow */
  status?: string;
  /** The steps of the workflow */
  steps?: string[];
}

export interface CreateIssueDto {
  /** The title of the issue */
  title: string;
  /** The description of the issue */
  description?: string;
  /** The workspace ID of the issue */
  workspaceId: string;
  /** The project ID of the issue */
  projectId?: string;
  /** The workflow ID of the issue */
  workflowId?: string;
  /** The current step ID of the issue */
  currentStepId?: string;
  /** The direct assignee ID of the issue */
  directAssigneeId?: string;
  /** The status of the issue */
  status?: string;
  /** The priority of the issue */
  priority?: string;
  /**
   * The due date of the issue
   * @format date-time
   */
  dueDate?: string;
  /**
   * The start date of the issue
   * @format date-time
   */
  startDate?: string;
  /** The parent task ID of the issue */
  parentTaskId?: string;
}

export interface UpdateIssueDto {
  /** The title of the issue */
  status?: string;
  /** The priority of the issue */
  priority?: string;
  /**
   * The due date of the issue
   * @format date-time
   */
  dueDate?: string;
  /**
   * The start date of the issue
   * @format date-time
   */
  startDate?: string;
  /** The current step ID of the issue */
  currentStepId?: string;
}

export interface CreateCommentDto {
  /**
   * The content of the comment
   * @example "This is a comment"
   */
  content: string;
}

export interface CreateIssueDependencyDto {
  /** The ID of the issue that this issue depends on */
  dependsOnIssueId: string;
}

export interface CreateProjectDto {
  /** The name of the project */
  name: string;
  /** The description of the project */
  description?: string;
}

export interface UpdateProjectDto {
  /** The name of the project */
  name?: string;
  /** The description of the project */
  description?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Synaply API
 * @version 1.0
 * @contact
 *
 * Synaply项目的API文档
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags app
   * @name AppControllerGetHello
   * @summary 获取欢迎信息
   * @request GET:/
   */
  appControllerGetHello = (params: RequestParams = {}) =>
    this.request<string, any>({
      path: `/`,
      method: "GET",
      format: "json",
      ...params,
    });

  auth = {
    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerGetMe
     * @summary 获取当前用户信息
     * @request GET:/auth/me
     * @secure
     */
    authControllerGetMe: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/me`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetMe
     * @summary 获取当前用户详细信息
     * @request GET:/users/me
     * @secure
     */
    userControllerGetMe: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/me`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  teams = {
    /**
     * No description
     *
     * @tags Team
     * @name TeamControllerCreate
     * @request POST:/teams
     */
    teamControllerCreate: (data: CreateTeamDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teams`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Team
     * @name TeamControllerGetUserTeams
     * @request GET:/teams
     */
    teamControllerGetUserTeams: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teams`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Team
     * @name TeamControllerInvite
     * @request POST:/teams/{teamId}/invite
     */
    teamControllerInvite: (
      teamId: string,
      data: InviteMemberDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/teams/${teamId}/invite`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Team
     * @name TeamControllerGetTeam
     * @request GET:/teams/{teamId}
     */
    teamControllerGetTeam: (teamId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teams/${teamId}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Team
     * @name TeamControllerUpdateMemberRole
     * @request PATCH:/teams/{teamId}/members/{memberId}/role
     */
    teamControllerUpdateMemberRole: (
      teamId: string,
      memberId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/teams/${teamId}/members/${memberId}/role`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Team
     * @name TeamControllerRemoveMember
     * @request DELETE:/teams/{teamId}/members/{memberId}
     */
    teamControllerRemoveMember: (
      teamId: string,
      memberId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/teams/${teamId}/members/${memberId}`,
        method: "DELETE",
        ...params,
      }),
  };
  workspaces = {
    /**
     * No description
     *
     * @tags Workspace
     * @name WorkspaceControllerGetUserWorkspaces
     * @request GET:/workspaces
     */
    workspaceControllerGetUserWorkspaces: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/workspaces`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Workspace
     * @name WorkspaceControllerGetWorkspaceById
     * @request GET:/workspaces/{workspaceId}
     */
    workspaceControllerGetWorkspaceById: (
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Workflows
     * @name WorkflowsControllerCreate
     * @request POST:/workspaces/{workspaceId}/workflows
     */
    workflowsControllerCreate: (
      workspaceId: string,
      data: CreateWorkflowDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Workflows
     * @name WorkflowsControllerFindAll
     * @request GET:/workspaces/{workspaceId}/workflows
     */
    workflowsControllerFindAll: (
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Workflows
     * @name WorkflowsControllerFindOne
     * @request GET:/workspaces/{workspaceId}/workflows/{id}
     */
    workflowsControllerFindOne: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Workflows
     * @name WorkflowsControllerUpdate
     * @request PATCH:/workspaces/{workspaceId}/workflows/{id}
     */
    workflowsControllerUpdate: (
      id: string,
      workspaceId: string,
      data: UpdateWorkflowDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Workflows
     * @name WorkflowsControllerRemove
     * @request DELETE:/workspaces/{workspaceId}/workflows/{id}
     */
    workflowsControllerRemove: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Workflows
     * @name WorkflowsControllerPublish
     * @request POST:/workspaces/{workspaceId}/workflows/{id}/publish
     */
    workflowsControllerPublish: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}/publish`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerCreate
     * @request POST:/workspaces/{workspaceId}/issues
     */
    issuesControllerCreate: (
      workspaceId: string,
      data: CreateIssueDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerFindAll
     * @request GET:/workspaces/{workspaceId}/issues
     */
    issuesControllerFindAll: (
      workspaceId: string,
      query: {
        projectId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerFindOne
     * @request GET:/workspaces/{workspaceId}/issues/{id}
     */
    issuesControllerFindOne: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerUpdate
     * @request PATCH:/workspaces/{workspaceId}/issues/{id}
     */
    issuesControllerUpdate: (
      id: string,
      workspaceId: string,
      data: UpdateIssueDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerRemove
     * @request DELETE:/workspaces/{workspaceId}/issues/{id}
     */
    issuesControllerRemove: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerAddComment
     * @request POST:/workspaces/{workspaceId}/issues/{issueId}/comments
     */
    issuesControllerAddComment: (
      issueId: string,
      workspaceId: string,
      data: CreateCommentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${issueId}/comments`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerAddDependency
     * @request POST:/workspaces/{workspaceId}/issues/{issueId}/dependencies
     */
    issuesControllerAddDependency: (
      issueId: string,
      workspaceId: string,
      data: CreateIssueDependencyDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${issueId}/dependencies`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issues
     * @name IssuesControllerRemoveDependency
     * @request DELETE:/workspaces/{workspaceId}/issues/{issueId}/dependencies/{dependsOnIssueId}
     */
    issuesControllerRemoveDependency: (
      issueId: string,
      dependsOnIssueId: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${issueId}/dependencies/${dependsOnIssueId}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerCreate
     * @summary 创建项目
     * @request POST:/workspaces/{workspaceId}/projects
     * @secure
     */
    projectControllerCreate: (
      workspaceId: string,
      data: CreateProjectDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerFindAll
     * @summary 获取工作空间下的所有项目
     * @request GET:/workspaces/{workspaceId}/projects
     * @secure
     */
    projectControllerFindAll: (
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerFindOne
     * @summary 获取项目详情
     * @request GET:/workspaces/{workspaceId}/projects/{id}
     * @secure
     */
    projectControllerFindOne: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerUpdate
     * @summary 更新项目
     * @request PATCH:/workspaces/{workspaceId}/projects/{id}
     * @secure
     */
    projectControllerUpdate: (
      id: string,
      workspaceId: string,
      data: UpdateProjectDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerRemove
     * @summary 删除项目
     * @request DELETE:/workspaces/{workspaceId}/projects/{id}
     * @secure
     */
    projectControllerRemove: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
}
