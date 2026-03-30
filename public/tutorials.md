# Tutorials

## Template Builder Tutorial

Question templates act as blueprints for generating questions. Follow the steps below to create one:

1.	**Open the Template Builder**

    Navigate to the [Template Builder](https://edcraft.rizkiarm.com/template-builder) tab.

1.	**Input your algorithm code**
    
    Enter your algorithm using **Python** only.

    Example:

    ```python
    def insertion_sort(arr):
        for i in range(1, len(arr)):
            key = arr[i]
            j = i - 1
            while j >= 0 and key < arr[j]:
                arr[j + 1] = arr[j]
                j -= 1
            arr[j + 1] = key
    ```

3. **Analyse the Code**
    
    Click `Analyse Code` to examine the code structure and identify its components.

3.	**Configure the Target**

    The target determines how the answer will be extracted from your code.

    **Example scenario:**
    
    Question: "What is the state of the array after each iteration of insertion sort?"

    To obtain the answer, find the value of `arr` at the end of each iteration of the outer for loop.

    To achieve this, configure:

    * Loop: `for i in range(1, len(arr))`

    * Loop iterations:
        * Enables analysis of each iteration individually

    * View elements inside loop iterations:
        * Applies subseqent selections within each iteration

        ![Loop iteration selection](/public/assets/tutorial/loop-iteration-selection.png)
    
    * Variable `arr`

        ![Variable selection](/public/assets/tutorial/variable-selection.png)

3.	**Set Output Type**
    
    Select `Last` to capture the final value of `arr` at the end of each loop iteration.

3. **Choose the Entry Function**

    Select `insertion_sort` as the entry function.
    
    This is the function where inputs are passed into your code.

    ![Question config](/public/assets/tutorial/question-config.png)

3.	**Create a Question Template (Optional)**

    You can define a dynamic question using input variables.

    Example: "What is the state of the array after each iteration of insertion sort? Given the array: {arr}"

3. **Configure Input Generation**

    Set up input generation to generate inputs for the code.

    Example: Generate an integer array
    * Select `Array`
    * Define minimum and maximum number of elements
    * Choose `Integer` for item schema
    * Set minimum and maximum values for the integers

    ![Array Input Generation Configuration](/public/assets/tutorial/array-input-generation.png)

3.	**Provide Input Values**

    To generate a question preview.

    Either:
    * Generate inputs by clicking `Generate`, or
    * Enter custom values manually

3. **Preview the Template**

    Click `Generate Template Preview` to see the final output.

3. **Save Template**
