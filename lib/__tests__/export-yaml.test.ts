import { exportToYaml } from '../export-yaml';
import type { Project } from '@/types/project';
import type { ServerConfig } from '@/types';

describe('exportToYaml', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  const createMockProject = (overrides?: Partial<Project>): Project => ({
    name: 'Test Project',
    description: 'Test Description',
    gameId: 1,
    promptPartials: [
      {
        id: '1',
        name: 'test_partial',
        content: 'This is a test partial content',
      },
    ],
    agentRoles: [
      {
        roleId: 1,
        name: 'TestAgent',
        llmType: 'openai',
        llmParams: {
          modelName: 'gpt-4',
          temperature: 0.7,
        },
        numberOfAgents: 2,
        prompts: {
          system: 'You are a test agent',
          user: 'Perform test actions',
        },
        taskPhases: [1, 2],
      },
    ],
    state: {
      metaInformation: [
        { name: 'game_id', type: 'int', default: 0 },
      ],
      publicInformation: [
        { name: 'current_price', type: 'float', default: 100.0 },
      ],
      privateInformation: [
        { name: 'balance', type: 'float', default: 1000.0 },
      ],
    },
    manager: {
      type: 'TurnBasedPhaseManager',
    },
    logsDir: './logs',
    logLevel: 'info',
    ...overrides,
  });

  const mockServerConfig: ServerConfig = {
    id: '1',
    name: 'Test Server',
    hostname: 'localhost',
    port: 8080,
    path: '/api',
  };

  it('handles environments without File System Access API', async () => {
    // Mock a browser environment without File System Access API
    const mockCreateElement = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockAnchor);

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as any;

    // Ensure window exists but without showSaveFilePicker
    (global as any).window = {};

    const project = createMockProject();
    
    await exportToYaml(project, mockServerConfig);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'File System Access API not supported. Using fallback download method.'
    );
    
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.download).toBe('test_project_config.yaml');
    expect(mockClick).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
    expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('sanitizes filename correctly', async () => {
    const mockCreateElement = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockAnchor);

    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as any;

    (global as any).window = {};

    const project = createMockProject({
      name: 'Project with Special!@#$%^&*() Characters',
    });
    
    await exportToYaml(project, mockServerConfig);

    expect(mockAnchor.download).toBe('project_with_special____________characters_config.yaml');
  });

  it('generates YAML with correct structure', async () => {
    // We'll test the YAML generation by checking the blob content
    let capturedBlob: Blob | null = null;

    const mockCreateElement = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockAnchor);

    global.URL.createObjectURL = jest.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    global.URL.revokeObjectURL = jest.fn();

    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as any;

    (global as any).window = {};

    const project = createMockProject();
    
    await exportToYaml(project, mockServerConfig);

    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob?.type).toBe('text/yaml;charset=utf-8');

    // Read the blob content
    const text = await capturedBlob!.text();
    
    // Check basic structure
    expect(text).toContain('name: "Test Project"');
    expect(text).toContain('description: "Test Description"');
    expect(text).toContain('game_id: 1');
    
    // Check prompt partials
    expect(text).toContain('prompt_partials:');
    expect(text).toContain('name: "test_partial"');
    expect(text).toContain('content: |');
    expect(text).toContain('This is a test partial content');
    
    // Check agent roles
    expect(text).toContain('agent_roles:');
    expect(text).toContain('role_id: 1');
    expect(text).toContain('name: "TestAgent"');
    expect(text).toContain('llm_type: "openai"');
    expect(text).toContain('model_name: "gpt-4"');
    expect(text).toContain('temperature: 0.7');
    
    // Check agents
    expect(text).toContain('agents:');
    expect(text).toContain('- id: 1');
    expect(text).toContain('- id: 2');
    
    // Check state
    expect(text).toContain('state:');
    expect(text).toContain('meta_information:');
    expect(text).toContain('public_information:');
    expect(text).toContain('private_information:');
    
    // Check manager and runner
    expect(text).toContain('manager:');
    expect(text).toContain('type: "TurnBasedPhaseManager"');
    expect(text).toContain('runner:');
    expect(text).toContain('type: "TurnBasedGameRunner"');
    
    // Check server config
    expect(text).toContain('hostname: "localhost"');
    expect(text).toContain('port: 8080');
    expect(text).toContain('path: "/api"');
  });

  it('handles HybridPhaseManager correctly', async () => {
    let capturedBlob: Blob | null = null;

    const mockCreateElement = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockAnchor);

    global.URL.createObjectURL = jest.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    global.URL.revokeObjectURL = jest.fn();

    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as any;

    (global as any).window = {};

    const project = createMockProject({
      manager: {
        type: 'HybridPhaseManager',
        continuousPhases: [1, 3],
        maxActionDelay: 10,
        minActionDelay: 1,
      },
    });
    
    await exportToYaml(project, mockServerConfig);

    const text = await capturedBlob!.text();
    
    expect(text).toContain('type: "HybridPhaseManager"');
    expect(text).toContain('type: "HybridGameRunner"');
    expect(text).toContain('continuous_phases: [1, 3]');
    expect(text).toContain('max_action_delay: 10');
    expect(text).toContain('min_action_delay: 1');
  });

  it('handles empty arrays and missing fields gracefully', async () => {
    let capturedBlob: Blob | null = null;

    const mockCreateElement = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockAnchor);

    global.URL.createObjectURL = jest.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    global.URL.revokeObjectURL = jest.fn();

    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as any;

    (global as any).window = {};

    const project = createMockProject({
      description: undefined,
      gameId: undefined,
      promptPartials: [],
      agentRoles: [],
      state: {
        metaInformation: [],
        publicInformation: [],
        privateInformation: [],
      },
    });
    
    await exportToYaml(project, mockServerConfig);

    const text = await capturedBlob!.text();
    
    // Should not include missing fields
    expect(text).not.toContain('description:');
    expect(text).not.toContain('game_id:');
    expect(text).not.toContain('prompt_partials:');
    expect(text).not.toContain('agent_roles:');
    expect(text).not.toContain('agents:');
  });
});