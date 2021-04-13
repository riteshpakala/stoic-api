import Fluent
import Vapor
import DirectoryService


func routes(_ app: Application) throws {
    app.get { req in
        return "It works!"
    }

    try app.register(collection: ThinkController(loopGroup: app.eventLoopGroup))
}
