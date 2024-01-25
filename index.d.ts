/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("./src/middleware/lucia.middleware.js").Auth;
  type DatabaseUserAttributes = {
    username: string;
    email: string;
  };
  type DatabaseSessionAttributes = {};
}
