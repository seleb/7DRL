	precision mediump float;
	uniform sampler2D tex0;
	uniform sampler2D tex1;
	uniform float time;
	uniform vec2 resolution;
	
	uniform vec2 gridOffset;
	uniform vec2 lightOffset;

	const float PI = 3.14159;
	const float PI2 = PI*2.0;

	vec2 uBufferSize = vec2(288.0);
	vec2 uSpriteSize = vec2(288.0);
	vec2 gridSize = vec2(24.0);

	//https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
	float rand(vec2 co){
	  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
	}

	float easeInOutSine(float t, float b, float c, float d) {
		return -c/2.0 * (cos(PI*t/d) - 1.0) + b;
	}

	vec3 tex(vec2 uv){
		return texture2D(tex0, uv).rgb;
	}

	float vignette(vec2 uv, float amount){
		uv = clamp(uv, 0.0, 1.0);
		uv = uv * uBufferSize / uSpriteSize;
		uv*=2.0;
		uv -= 1.0;
		return clamp((1.0-uv.y*uv.y)*(1.0-uv.x*uv.x)/amount, 0.0, 1.0);
	}

	float grille(vec2 uv, vec2 amount){
		vec2 g = mod(uv*uBufferSize,vec2(1.0));
		g *= 2.0;
		g -= 1.0;
		g = abs(g);
		g.x = 1.0 - g.x*amount.y;
		g.y = 1.0 - g.y*amount.x;
		return 1.0-pow(1.0-g.y*g.x,2.0);
	}

	// chromatic abberation
	vec3 chrAbb(vec2 uv, float separation, float rotation){
		vec2 o = separation/uBufferSize;
		return vec3(
			tex(uv + vec2(o.x*sin(PI2*1.0/3.0+rotation),o.y*cos(PI2*1.0/3.0+rotation))).r,
			tex(uv + vec2(o.x*sin(PI2*2.0/3.0+rotation),o.y*cos(PI2*2.0/3.0+rotation))).g,
			tex(uv + vec2(o.x*sin(PI2*3.0/3.0+rotation),o.y*cos(PI2*3.0/3.0+rotation))).b
		);
	}
	float px(float v, float t){
		return v-mod(v,1.0/mix(uSpriteSize.x,uSpriteSize.y,t));
	}
	void main(void){
		float t = mod(time, 1000.0);
		vec2 uvo = gl_FragCoord.xy / resolution;
		vec2 uv = uvo;

		float o = floor(uv.y*uSpriteSize.y);
		float r = floor(uv.x*uSpriteSize.x);
		vec2 puv = floor(uv * gridSize - gridOffset) / gridSize;

		vec3 fg = tex(uv);
		float chrAbbSeparation = pow(
			distance(
				uv,
				vec2(0.5)
			),
			0.8
		) * 2.5 + 0.2;
		float chrAbbRotation=mod(t/10.0, PI2);
		fg += chrAbb(uv, chrAbbSeparation, chrAbbRotation+PI2*(uv.x+uv.y)) * 0.2;
		fg *= grille(uv, vec2(0.6,0.3));
		fg.r = clamp(0.0, fg.r, 1.0);
		fg.g = clamp(0.0, fg.g, 1.0);
		fg.b = clamp(0.0, fg.b, 1.0);
		fg *= pow(vignette(puv + lightOffset,1.0),3.0);
		fg *= mix(1.0, rand(puv + t), 0.25 * step(0.98, rand(puv + t + 0.5)));
		gl_FragColor = vec4(fg.rgb, 1.0);
	}
