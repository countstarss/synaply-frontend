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

export interface CreateGroupChatDto {
  /**
   * 群聊名称
   * @example "产品设计讨论组"
   */
  name: string;
  /**
   * 群聊描述
   * @example "关于V2版本UI/UX的讨论"
   */
  description?: string;
  /**
   * 群聊成员的TeamMember ID列表
   * @example ["uuid-of-member-1","uuid-of-member-2"]
   */
  memberIds: string[];
}

export interface CreatePrivateChatDto {
  /**
   * 私聊对象的TeamMember ID
   * @example "uuid-of-target-member"
   */
  targetMemberId: string;
}

export type UpdateChatDto = object;

export interface AddChatMembersDto {
  /**
   * 要添加到群聊的TeamMember ID列表
   * @example ["uuid-of-new-member-1","uuid-of-new-member-2"]
   */
  memberIds: string[];
}

export interface CreateMessageDto {
  /**
   * 消息内容
   * @example "你好，明天会议时间不变。"
   */
  content: string;
  /**
   * 消息类型
   * @example "TEXT"
   */
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  /**
   * 回复的消息ID
   * @example "uuid-of-message-to-reply"
   */
  repliedToMessageId?: string;
}

export interface UpdateMessageDto {
  /**
   * 要更新的消息内容
   * @example "你好，明天会议时间不变。"
   */
  content?: string;
  /**
   * 消息类型
   * @example "TEXT"
   */
  type?: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  /**
   * 回复的消息ID
   * @example "uuid-of-message-to-reply"
   */
  repliedToMessageId?: string;
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
     * @tags Workflow
     * @name WorkflowControllerCreate
     * @request POST:/workspaces/{workspaceId}/workflows
     */
    workflowControllerCreate: (
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
     * @tags Workflow
     * @name WorkflowControllerFindAll
     * @request GET:/workspaces/{workspaceId}/workflows
     */
    workflowControllerFindAll: (
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
     * @tags Workflow
     * @name WorkflowControllerFindOne
     * @request GET:/workspaces/{workspaceId}/workflows/{id}
     */
    workflowControllerFindOne: (
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
     * @tags Workflow
     * @name WorkflowControllerUpdate
     * @request PATCH:/workspaces/{workspaceId}/workflows/{id}
     */
    workflowControllerUpdate: (
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
     * @tags Workflow
     * @name WorkflowControllerRemove
     * @request DELETE:/workspaces/{workspaceId}/workflows/{id}
     */
    workflowControllerRemove: (
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
     * @tags Workflow
     * @name WorkflowControllerPublish
     * @request POST:/workspaces/{workspaceId}/workflows/{id}/publish
     */
    workflowControllerPublish: (
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
     * @tags Issue
     * @name IssueControllerCreate
     * @request POST:/workspaces/{workspaceId}/issues
     */
    issueControllerCreate: (
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
     * @tags Issue
     * @name IssueControllerFindAll
     * @request GET:/workspaces/{workspaceId}/issues
     */
    issueControllerFindAll: (
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
     * @tags Issue
     * @name IssueControllerFindOne
     * @request GET:/workspaces/{workspaceId}/issues/{id}
     */
    issueControllerFindOne: (
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
     * @tags Issue
     * @name IssueControllerUpdate
     * @request PATCH:/workspaces/{workspaceId}/issues/{id}
     */
    issueControllerUpdate: (
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
     * @tags Issue
     * @name IssueControllerRemove
     * @request DELETE:/workspaces/{workspaceId}/issues/{id}
     */
    issueControllerRemove: (
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
     * @tags Issue
     * @name IssueControllerAddComment
     * @request POST:/workspaces/{workspaceId}/issues/{issueId}/comments
     */
    issueControllerAddComment: (
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
     * @tags Issue
     * @name IssueControllerAddDependency
     * @request POST:/workspaces/{workspaceId}/issues/{issueId}/dependencies
     */
    issueControllerAddDependency: (
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
     * @tags Issue
     * @name IssueControllerRemoveDependency
     * @request DELETE:/workspaces/{workspaceId}/issues/{issueId}/dependencies/{dependsOnIssueId}
     */
    issueControllerRemoveDependency: (
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
  chats = {
    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerCreateGroupChat
     * @summary 创建群聊
     * @request POST:/chats/group
     * @secure
     */
    chatControllerCreateGroupChat: (
      data: CreateGroupChatDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/group`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerCreatePrivateChat
     * @summary 创建或获取私聊
     * @request POST:/chats/private
     * @secure
     */
    chatControllerCreatePrivateChat: (
      data: CreatePrivateChatDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/private`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerFindAllChats
     * @summary 获取当前用户的所有聊天会话
     * @request GET:/chats
     * @secure
     */
    chatControllerFindAllChats: (
      query: {
        type: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerFindOneChat
     * @summary 获取单个聊天会话的详细信息
     * @request GET:/chats/{chatId}
     * @secure
     */
    chatControllerFindOneChat: (chatId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/chats/${chatId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerUpdateChat
     * @summary 更新群聊信息（仅限管理员）
     * @request PATCH:/chats/{chatId}
     * @secure
     */
    chatControllerUpdateChat: (
      chatId: string,
      data: UpdateChatDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerDeleteChat
     * @summary 删除聊天会话（仅限创建者）
     * @request DELETE:/chats/{chatId}
     * @secure
     */
    chatControllerDeleteChat: (chatId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/chats/${chatId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerAddMembersToGroupChat
     * @summary 向群聊添加新成员（仅限管理员）
     * @request POST:/chats/{chatId}/members
     * @secure
     */
    chatControllerAddMembersToGroupChat: (
      chatId: string,
      data: AddChatMembersDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/members`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerRemoveMemberFromGroupChat
     * @summary 从群聊移除成员（仅限管理员）
     * @request DELETE:/chats/{chatId}/members/{teamMemberId}
     * @secure
     */
    chatControllerRemoveMemberFromGroupChat: (
      chatId: string,
      teamMemberId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/members/${teamMemberId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerLeaveGroupChat
     * @summary 当前用户退出群聊
     * @request POST:/chats/{chatId}/leave
     * @secure
     */
    chatControllerLeaveGroupChat: (
      chatId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/leave`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Message
     * @name MessageControllerCreateMessage
     * @summary 在指定聊天中发送消息
     * @request POST:/chats/{chatId}/messages
     * @secure
     */
    messageControllerCreateMessage: (
      chatId: string,
      data: CreateMessageDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/messages`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Message
     * @name MessageControllerFindMessagesByChatId
     * @summary 获取指定聊天的消息列表（分页）
     * @request GET:/chats/{chatId}/messages
     * @secure
     */
    messageControllerFindMessagesByChatId: (
      chatId: string,
      query: {
        cursor: string;
        limit: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/messages`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Message
     * @name MessageControllerUpdateMessage
     * @summary 编辑已发送的消息（仅限发送者）
     * @request PATCH:/chats/{chatId}/messages/{messageId}
     * @secure
     */
    messageControllerUpdateMessage: (
      messageId: string,
      chatId: any,
      data: UpdateMessageDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/messages/${messageId}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Message
     * @name MessageControllerDeleteMessage
     * @summary 删除已发送的消息（仅限发送者，软删除）
     * @request DELETE:/chats/{chatId}/messages/{messageId}
     * @secure
     */
    messageControllerDeleteMessage: (
      messageId: string,
      chatId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/messages/${messageId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Message
     * @name MessageControllerMarkMessageAsRead
     * @summary 将消息标记为已读
     * @request POST:/chats/{chatId}/messages/{messageId}/read
     * @secure
     */
    messageControllerMarkMessageAsRead: (
      chatId: string,
      messageId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/chats/${chatId}/messages/${messageId}/read`,
        method: "POST",
        secure: true,
        ...params,
      }),
  };
}
