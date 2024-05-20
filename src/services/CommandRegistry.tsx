type CommandFunction = (...args: any[]) => any

// This is a singleton
class CommandRegistry {
  private static instance: CommandRegistry
  private commands: Record<string, CommandFunction>

  private constructor() {
    this.commands = {}
    this.register('list', this.listCommands.bind(this))
  }

  public static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry()
    }
    return CommandRegistry.instance
  }

  public register(name: string, commandFunction: CommandFunction): void {
    this.commands[name] = commandFunction;
  }

  public executeCommand(name: string, ...args: any[]): any {
    const command = this.commands[name]
    if (command) {
      return command(...args)
    } else {
      throw new Error(`Command '${name}' not found in this context.`)
    }
  }

  public getCommands(): Record<string, CommandFunction> {
    return this.commands
  }

  // Command to list all registered commands.
  private listCommands(): string[] {
    return Object.keys(this.commands)
  }
}

export const commandRegistry = CommandRegistry.getInstance()
