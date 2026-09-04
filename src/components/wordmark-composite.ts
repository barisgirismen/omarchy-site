export const wordmarkEtchPad = 2
export const wordmarkPlateOnLight = 0.22
export const wordmarkPlateOnDark = 0.78
/** Grey halo around etched letters. The shader stays; flip `on` to bring it back. */
export const wordmarkOutline: { on: boolean } = { on: false }

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAGMENT = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform float u_pad;
uniform float u_plate;
varying vec2 v_uv;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec4 color = texture2D(u_tex, v_uv);
  float lit = luma(color.rgb);
  if (lit > 0.06) {
    gl_FragColor = vec4(color.rgb, 1.0);
    return;
  }

  if (u_pad < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float cover = 0.0;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      if (length(vec2(float(x), float(y))) > u_pad) {
        continue;
      }
      vec4 sampleColor = texture2D(u_tex, v_uv + vec2(float(x), float(y)) * u_texel);
      cover = max(cover, step(0.06, luma(sampleColor.rgb)));
    }
  }

  vec3 plate = vec3(u_plate);
  gl_FragColor = vec4(plate * cover, cover);
}
`

export type WordmarkCompositor = {
  draw: (source: HTMLCanvasElement, pad: number, plate: number) => void
  destroy: () => void
}

export function createWordmarkCompositor(
  target: HTMLCanvasElement,
): WordmarkCompositor | null {
  const gl = target.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    preserveDrawingBuffer: true,
  })
  if (!gl) {
    return null
  }

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  if (!vertex || !fragment) {
    return null
  }

  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null
  }

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  )

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  const aPos = gl.getAttribLocation(program, 'a_pos')
  const uTex = gl.getUniformLocation(program, 'u_tex')
  const uTexel = gl.getUniformLocation(program, 'u_texel')
  const uPad = gl.getUniformLocation(program, 'u_pad')
  const uPlate = gl.getUniformLocation(program, 'u_plate')
  gl.useProgram(program)
  gl.uniform1i(uTex, 0)

  return {
    draw(source, pad, plate) {
      if (source.width < 1 || source.height < 1) {
        return
      }
      if (target.width !== source.width || target.height !== source.height) {
        target.width = source.width
        target.height = source.height
      }
      gl.viewport(0, 0, target.width, target.height)
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      )
      gl.uniform2f(uTexel, 1 / source.width, 1 / source.height)
      gl.uniform1f(uPad, wordmarkOutline.on ? pad : 0)
      gl.uniform1f(uPlate, plate)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    destroy() {
      gl.deleteBuffer(buffer)
      gl.deleteTexture(texture)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    },
  }
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) {
    return null
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}
