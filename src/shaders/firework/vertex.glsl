uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress; //? to be used to animate

attribute float aSize;
attribute float aTimeMultiplier;


//? to split the uProgrees into progress for each animation
float remap(float value, float originMin, float originMax, float destinationMin, float destinationMax) {
    return destinationMin + (value - originMin) * (destinationMax - destinationMin) / (originMax - originMin);
}

void main() {
    //? need to set a gl_PointSize. Set it to 20.0 for now, which should correspond to 20 fragments:
    // gl_PointSize = 20.0;

    // * ANIMATION
    //! we want to change the position, but this is an attribute (we can't change it) so we need to use another variable
    // vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 newPosition = position;

    //! Randomness
    //? A new progress with the multiplier makes the progress goes above 1.0 so the animation goez faster (x>1 in a 3 secs makes thing goes faster)
    //todo change uProgress by progress
    float progress = uProgress * aTimeMultiplier;

    // ? To separarete all the animations we have to split the uProgress for each animation
    //* 1-EXPLOTE
    // ? 👇 the uProgress goes from 0 to 1.0 , so it takes uProgress from 0.0 to 0.1 and remap the value to 1.0. The last to values defines the range in wich this logic is applied (the destination)
    float explodingProgress = remap(progress, 0.0, 0.1, 0.0, 1.0);

    //! but does NOT stop at 0.1 so we use clamp function 
    // ? 👇 valuyes below 0.0 return 0.0 , above 1.0 returns 1.0 and between 0.0 and 1.0 the value itself
    explodingProgress = clamp(explodingProgress, 0.0, 1.0);

    // ? 👇 to make animation fast at the begining and slow down before ending use the pow
    // explodingProgress = pow(explodingProgress, 3.0);

    // ? 👇 but is the opposite slow at beggining, fast at end so, start from 1.0 and goes to 0.0 
    // ? 👇esta es la inversa
    explodingProgress = 1.0 - pow(1.0 - explodingProgress, 3.0);

    // ? explodingProgress starts from 0 and goes to 1.0 so the position starts on 0,0,0 ando end at the seted position 
    newPosition *= explodingProgress;

    //* 2-FALLING
    // ? the same process of EXPLOTE, but starts after exploted ends (0.1:remap origin parameter) until 1.0 
    float fallingProgress = remap(progress, 0.1, 1.0, 0.0, 1.0);
    fallingProgress = clamp(fallingProgress, 0.0, 1.0);
    fallingProgress = 1.0 - pow(1.0 - fallingProgress, 3.0);

    // ? we want to fall, so the progress must be subtracted from the Y axis
    newPosition.y -= fallingProgress * 0.2;

    //* 3-SCALING

    //? split in two: 1) opening: scale up fast (from 0 to 0.125) 2) closing: scales down slowly (from 0.125 to 1.0)
    float sizeOpeningProgress = remap(progress, 0.0, 0.125, 0.0, 1.0);
    //? goes from 1.0 to 0.0 cause is reducing the size
    float sizeClosingProgress = remap(progress, 0.125, 1.0, 1.0, 0.0);
    //? use the minimun of both, necer goes aboce 1.0
    float sizeProgress = min(sizeClosingProgress, sizeOpeningProgress);
    sizeProgress = clamp(sizeProgress, 0.0, 1.0);


    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    //* 4-TWINKLING
    //? we want to to start twinkling just after starts to scale down, 
    //? but the effect must be seen before the particle is gone at it maximun
    float twinklingProgress = remap(progress, 0.2, 0.8, 0.0 , 1.0);
    twinklingProgress = clamp(twinklingProgress, 0.0 , 1.0);
    //? we want the size to go to 0 to 1 and viceversa repeatly so a sin is used
    //? sin goex from -1 to +1, so if *0.5 goes to -0.5 to +0.5 and +0.5 goes to 0 to 1
    //? and uProgress * 30 to increse the frequency
    float sizeTwinkling  = sin(progress * 30.0) * 0.5 + 0.5;

    //? twinklingProgress goes from 0 to 1 we want the opposite cause particles are vanishing , so to add the twinkling progress:
    sizeTwinkling = 1.0 -  sizeTwinkling * twinklingProgress;

    //* 5-RANDOMNESS
    //? a random multiplier time fort each particle must be stablihed, so it burn fast ,but it must not be longer that the 3 secs of the whole animation
    //? so the random existence only will be subtracted
    //todo: create the attribute for the material inside the script
    //todo: change uProgress by progress

    // * SIZE
    // Final size
    // gl_PointSize = uSize;

    //? only the uResolution for the Y axes, cause Field Of view is vertical
    // gl_PointSize = uSize * uResolution.y * aSize ;
    
    //? multiply by the sizeProgress
    gl_PointSize = uSize * uResolution.y * aSize * sizeProgress;
    
    //? multiplied by sizeTwinkling to add twinkling
    gl_PointSize = uSize * uResolution.y * aSize * sizeProgress * sizeTwinkling;

    // the closer the biger👇
    gl_PointSize *= 1.0 / -viewPosition.z;

    //! to avoid a WINDOWS OS problem about pixel size a particle wit size below 1 will be sent out to not be renderes
    if (gl_PointSize < 1.0)
        gl_Position = vec4(9999.9); //? it canot be dispossed so it moves very very far away
}
